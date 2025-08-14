$(document).ready(function () {
  // ===== DOM Elements =====
  const $chatMessages = $('#chatMessages');
  const $messageInput = $('#messageInput');
  const $sendBtn = $('#sendBtn');
  const $typingIndicator = $('#typingIndicator');
  const $chatbotContainer = $('.chatbot-container');
  const $chatbotToggle = $('#chatbotToggle');

  // ===== Settings =====
  const WEBHOOK_URL = 'https://acdd.app.n8n.cloud/webhook/65feb8e4-da37-45bd-9993-f07bf3bdcb39';
  const REQUEST_TIMEOUT_MS = 30000; // 30s timeout

  // ===== Init =====
  initChatbot();

  function initChatbot() {
    $chatbotContainer.removeClass('show');
    $chatbotToggle.show();
    bindEvents();
  }

  function bindEvents() {
    $sendBtn.on('click', sendMessage);
    $messageInput.on('keypress', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    $('#closeBtn').on('click', hideChatbot);
    $chatbotToggle.on('click', toggleChatbot);

    $messageInput
      .on('focus', function () {
        $(this).parent().addClass('focused');
      })
      .on('blur', function () {
        $(this).parent().removeClass('focused');
      });
  }

  // ===== Chat UI Helpers =====
  function addMessage(text, sender) {
    const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
    const avatarIcon = sender === 'user' ? 'fas fa-user' : '';
    const avatarImage = sender === 'user'
      ? ''
      : '<img src="https://www.dignitasdigital.com/wp-content/uploads/2021/01/DD-Logo_03.jpg" alt="Jubilant Biosys Logo">';
    const currentTime = getCurrentTime();

    // If bot → render basic markdown (links, bold) to HTML; if user → escape HTML
    const safeHtml = sender === 'bot'
      ? renderBotHtml(String(text ?? ''))
      : formatText(String(text ?? ''));

    // Add feedback buttons for bot messages
    const feedbackButtons = sender === 'bot' ? `
      <div class="feedback-buttons">
        <button class="feedback-btn like-btn" data-type="like" title="This response was helpful">
          <i class="fas fa-thumbs-up"></i>
          <span>Helpful</span>
        </button>
        <button class="feedback-btn dislike-btn" data-type="dislike" title="This response could be improved">
          <i class="fas fa-thumbs-down"></i>
          <span>Not Helpful</span>
        </button>
      </div>
    ` : '';

    const messageHtml = `
      <div class="message ${messageClass} new">
        <div class="message-avatar">
          ${sender === 'user' ? `<i class="${avatarIcon}"></i>` : avatarImage}
        </div>
        <div class="message-content">
          <p>${safeHtml}</p>
          <span class="message-time">${currentTime}</span>
          ${feedbackButtons}
        </div>
      </div>`;

    $chatMessages.append(messageHtml);

    // Bind feedback events for new bot messages
    if (sender === 'bot') {
      const $newMessage = $chatMessages.find('.message.new').last();
      bindFeedbackEvents($newMessage);
    }

    setTimeout(() => {
      $chatMessages.find('.message.new').removeClass('new');
    }, 300);

    scrollToBottom();
  }

  // Bind feedback button events
  function bindFeedbackEvents($messageElement) {
    const $likeBtn = $messageElement.find('.like-btn');
    const $dislikeBtn = $messageElement.find('.dislike-btn');

    $likeBtn.on('click', function() {
      handleFeedback($(this), $dislikeBtn, 'like');
    });

    $dislikeBtn.on('click', function() {
      handleFeedback($(this), $likeBtn, 'dislike');
    });
  }

  // Handle feedback button clicks
  function handleFeedback($clickedBtn, $otherBtn, feedbackType) {
    const $messageElement = $clickedBtn.closest('.message');
    
    // Add click animation
    $clickedBtn.addClass('clicked');
    setTimeout(() => $clickedBtn.removeClass('clicked'), 400);

    // Set active state for clicked button
    $clickedBtn.addClass('active');
    
    // Remove active state from other button
    $otherBtn.removeClass('active');

    // Disable both buttons after selection
    $clickedBtn.prop('disabled', true);
    $otherBtn.prop('disabled', true);

    // Add visual feedback
    $clickedBtn.css('pointer-events', 'none');
    $otherBtn.css('pointer-events', 'none');

    // Log feedback (you can send this to your analytics or backend)
    console.log(`User feedback: ${feedbackType} for message:`, $messageElement.find('p').text().substring(0, 100));

    // Optional: Show thank you message
    if (feedbackType === 'like') {
      $clickedBtn.html('<i class="fas fa-check"></i><span>Thank you!</span>');
    } else {
      $clickedBtn.html('<i class="fas fa-check"></i><span>Noted</span>');
    }

    // Store feedback in localStorage to persist across sessions
    const messageId = Date.now(); // Simple ID generation
    const feedbackData = {
      messageId: messageId,
      feedback: feedbackType,
      timestamp: new Date().toISOString(),
      message: $messageElement.find('p').text().substring(0, 100)
    };
    
    storeFeedback(feedbackData);
  }

  // Store feedback in localStorage
  function storeFeedback(feedbackData) {
    try {
      const existingFeedback = JSON.parse(localStorage.getItem('chatbotFeedback') || '[]');
      existingFeedback.push(feedbackData);
      
      // Keep only last 100 feedback entries
      if (existingFeedback.length > 100) {
        existingFeedback.splice(0, existingFeedback.length - 100);
      }
      
      localStorage.setItem('chatbotFeedback', JSON.stringify(existingFeedback));
    } catch (error) {
      console.error('Failed to store feedback:', error);
    }
  }

  // Render minimal, safe-ish HTML for bot messages
  function renderBotHtml(rawText) {
    if (!rawText) return '';

    // If response already contains HTML anchors, keep as-is
    let html = String(rawText);

    // Convert markdown bold **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert markdown links [label](https://url)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Clean section headings with minimal icons
    html = html.replace(/(?:<strong>)?\s*Relevant\s+Links:\s*(?:<\/strong>)?/gi,
      '<span class="section-title"><i class="fas fa-link"></i> Relevant Links:</span>');
    html = html.replace(/(?:<strong>)?\s*Read\s*also:\s*(?:<\/strong>)?/gi,
      '<span class="section-title"><i class="fas fa-book-open"></i> Read also:</span>');

    // Auto-link bare URLs if there is no existing <a ...> tag
    if (!/<a\b/i.test(html)) {
      html = html.replace(/(https?:\/\/[^\s<>'"()]+(?:\([^\s<>'"]*\))?)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    // Preserve new lines
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  function showTypingIndicator() {
    // Move indicator to the end so it appears below the latest message
    $typingIndicator.detach().appendTo($chatMessages).addClass('show');
    scrollToBottom();
  }

  function hideTypingIndicator() {
    $typingIndicator.removeClass('show');
  }

  function disableInput(disabled) {
    $messageInput.prop('disabled', disabled);
    $sendBtn.prop('disabled', disabled);
  }

  function scrollToBottom() {
    $chatMessages.stop().animate({ scrollTop: $chatMessages[0].scrollHeight }, 300);
  }

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function toggleChatbot() {
    if ($chatbotContainer.hasClass('show')) {
      hideChatbot();
    } else {
      showChatbot();
    }
  }

  function showChatbot() {
    $chatbotContainer.addClass('show');
    $messageInput.focus();
    $chatbotToggle.hide();
  }

  function hideChatbot() {
    $chatbotContainer.removeClass('show');
    $chatbotToggle.show();
  }

  function formatText(text) {
    // Escape HTML and preserve newlines
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ===== Core Flow =====
  function sendMessage() {
    const message = $messageInput.val().trim();
    if (!message) return;

    addMessage(message, 'user');

    $messageInput.val('');
    showTypingIndicator();
    disableInput(true);

    callWebhook(message)
      .then((reply) => {
        hideTypingIndicator();
        disableInput(false);
        addMessage(reply, 'bot');
      })
      .catch((err) => {
        hideTypingIndicator();
        disableInput(false);
        const reason = err?.name === 'AbortError'
          ? 'Request timed out'
          : (err?.message || 'Network error');
        addMessage(`Sorry—something went wrong (${reason}). Please try again.`, 'bot');
      });
  }

  async function callWebhook(question) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain;q=0.9, */*;q=0.8',
        },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const text = await safeReadText(res);
        throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ''}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        return extractAnswer(json);
      } else {
        const text = await res.text();
        return text || 'No response text returned.';
      }
    } finally {
      clearTimeout(timer);
    }
  }

  async function safeReadText(res) {
    try {
      return await res.text();
    } catch (_) {
      return '';
    }
  }

  function extractAnswer(payload) {
    try {
      if (payload == null) return 'No response received.';
      if (typeof payload === 'string') return payload;

      if (Array.isArray(payload.choices) && payload.choices.length) {
        const first = payload.choices[0];
        if (first?.message?.content) return String(first.message.content);
        if (first?.text) return String(first.text);
      }

      if (payload.message) {
        if (typeof payload.message === 'string') return payload.message;
        if (payload.message.content) return String(payload.message.content);
      }

      if (payload.content) return String(payload.content);
      if (payload.answer) return String(payload.answer);
      if (payload.output) return String(payload.output);

      return '```json\n' + JSON.stringify(payload, null, 2) + '\n```';
    } catch (e) {
      return 'Received a response, but could not parse it.';
    }
  }
});
