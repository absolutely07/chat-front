(function() {
  // Генерация случайных ников
  const adjectives = ['Beer', 'Mystic', 'Crazy', 'Sleepy', 'Fast', 'Smart', 'Wild', 'Lucky', 'Angry', 'Happy'];
  const nouns = ['Fox', 'Cat', 'Bear', 'Wolf', 'Hawk', 'Panda', 'Raccoon', 'Hedgehog', 'Owl', 'Deer'];
  function randomNick() {
    return adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
  }

  // Функция для обхода экрана входа
  function bypassLogin() {
    // Если уже есть ник в localStorage — не трогаем
    if (localStorage.getItem('nickname')) return;

    const nick = randomNick();
    localStorage.setItem('nickname', nick);

    // Ищем поле ввода и кнопку на странице
    const input = document.querySelector('input[type="text"]');
    const button = document.querySelector('button');
    if (input && button) {
      input.value = nick;
      button.click();
    }
  }

  // Запускаем после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bypassLogin);
  } else {
    bypassLogin();
  }

  // Перехват fetch для подмены ника и команды /del
  const BACKEND_URL = 'https://chat-back-0gpm.onrender.com';
  const originalFetch = window.fetch;

  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('/messages') && options && options.method === 'POST') {
      try {
        let body = JSON.parse(options.body);
        // Если ник не установлен (например, из-за особенностей React) — подменяем
        if (!body.nickname || body.nickname === '') {
          body.nickname = randomNick();
        }
        // Команда /del
        if (body.text === '/del') {
          fetch(BACKEND_URL + '/clear-all', { method: 'POST' }).catch(console.error);
          return Promise.resolve(new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        options.body = JSON.stringify(body);
      } catch(e) { console.error('Override fetch error:', e); }
    }
    return originalFetch.call(this, url, options);
  };
})();
