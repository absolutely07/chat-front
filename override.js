(function() {
  const STORAGE_KEY = "chat_nickname";
  const adjectives = ['Beer', 'Mystic', 'Crazy', 'Sleepy', 'Fast', 'Smart', 'Wild', 'Lucky', 'Angry', 'Happy', 'Cozy', 'Dark', 'Light', 'Silly', 'Brave', 'Clever'];
  const nouns = ['Fox', 'Cat', 'Bear', 'Wolf', 'Hawk', 'Panda', 'Raccoon', 'Hedgehog', 'Owl', 'Deer', 'Lion', 'Tiger', 'Falcon', 'Rabbit', 'Squirrel'];

  function randomNick() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
  }

  // Если нет ника в localStorage, генерируем и сохраняем
  let nickname = localStorage.getItem(STORAGE_KEY);
  if (!nickname) {
    nickname = randomNick();
    localStorage.setItem(STORAGE_KEY, nickname);
  }

  // Перехват fetch для команды /del и подмены ника (на случай, если React его не подхватит)
  const BACKEND_URL = 'https://chat-back-0gpm.onrender.com';
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('/messages') && options && options.method === 'POST') {
      try {
        let body = JSON.parse(options.body);
        // Если ник не передан, подставляем из localStorage
        if (!body.nickname || body.nickname === '') {
          body.nickname = localStorage.getItem(STORAGE_KEY);
        }
        // Обработка команды /del
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
    return originalFetch.apply(this, arguments);
  };
})();
