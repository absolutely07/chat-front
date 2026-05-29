// Перехватываем отправку формы или нажатие кнопки
setTimeout(() => {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1];
    if (url.includes('/messages') && options?.method === 'POST') {
      const body = JSON.parse(options.body);
      // генерируем ник
      const adjectives = ['Beer','Mystic','Crazy','Sleepy','Fast','Smart','Wild','Lucky','Angry','Happy'];
      const nouns = ['Fox','Cat','Bear','Wolf','Hawk','Panda','Raccoon','Hedgehog','Owl','Deer'];
      const randomNick = () => adjectives[Math.floor(Math.random()*adjectives.length)] + ' ' + nouns[Math.floor(Math.random()*nouns.length)];
      body.nickname = randomNick();
      options.body = JSON.stringify(body);
      
      // обрабатываем /del
      if (body.text === '/del') {
        fetch('https://chat-back-0gpm.onrender.com/clear-all', { method: 'POST' });
        return Promise.resolve(new Response(JSON.stringify({ok:true})));
      }
    }
    return originalFetch.apply(this, args);
  };
}, 1000);
