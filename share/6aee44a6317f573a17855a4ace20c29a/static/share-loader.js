/* Local adaptation for encrypted, read-only GitHub Pages snapshots. */
(() => {
  'use strict';
  const nativeFetch = window.fetch.bind(window);
  const base = new URL('./', location.href);
  const fragment = location.hash.includes('?') ? location.hash.split('?').slice(1).join('?') : location.hash.slice(1);
  const secret = new URLSearchParams(fragment).get('key');
  const decode = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const gate = document.createElement('div');
  gate.id = 'share-lock';
  const heading = document.createElement('h1');
  heading.textContent = 'Euler · 加密研究分享';
  const message = document.createElement('p');
  message.textContent = '正在读取加密数据…';
  gate.append(heading, message);
  document.body.append(gate);
  let bundle, lastCheck = 0, pending;
  async function readBundle(force = false) {
    if (!force && bundle && Date.now() - lastCheck < 60000) return bundle;
    if (pending) return pending;
    pending = (async () => {
      const response = await nativeFetch(new URL('snapshot.enc', base), {cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'});
      if (!response.ok) throw new Error('无法下载研究快照，请稍后刷新。');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (new TextDecoder().decode(bytes.slice(0, 4)) !== 'EUL1') throw new Error('快照格式不正确。');
      const key = await crypto.subtle.importKey('raw', decode(secret), 'AES-GCM', false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({name: 'AES-GCM', iv: bytes.slice(4, 16), additionalData: new TextEncoder().encode('euler-share-v1')}, key, bytes.slice(16));
      bundle = JSON.parse(new TextDecoder().decode(plain));
      lastCheck = Date.now();
      const label = document.querySelector('.public-snapshot');
      if (label) label.textContent = '只读研究快照 · 最后同步：' + new Date(bundle.updated_at).toLocaleString('zh-CN', {timeZone: 'Asia/Hong_Kong', hour12: false}) + '（香港时间）· 本机在线时每小时检查更新';
      return bundle;
    })();
    try { return await pending; }
    finally { pending = null; }
  }
  window.EulerShareReady = (async () => {
    if (!secret || !/^[A-Za-z0-9_-]{43}$/.test(secret)) {
      throw new Error('此页面需要包含解密密钥的完整分享链接，请向分享者获取。');
    }
    window.EulerShareKey = secret;
    await readBundle(true);
    gate.remove();
    document.addEventListener('click', event => {
      const anchor = event.target.closest('a[href]');
      if (!anchor) return;
      const address = new URL(anchor.href, location.href);
      if (address.origin === location.origin && address.pathname === base.pathname && address.hash && !address.hash.includes('key=')) {
        if (address.hash === '#main') { event.preventDefault(); document.querySelector('main')?.focus(); return; }
        address.hash += '?key=' + secret;
        anchor.href = address.href;
      }
    }, true);
  })();
  window.EulerShareReady.catch(() => {
    message.textContent = secret ? '无法解密。请检查分享链接是否完整，或稍后重试。' : '此页面需要包含解密密钥的完整分享链接，请向分享者获取。';
  });
  window.EulerEncryptedApi = async path => {
    await window.EulerShareReady;
    let data;
    try { data = await readBundle(); }
    catch (error) { if (!bundle) throw error; data = bundle; }
    const url = new URL(path, location.origin);
    if (!url.pathname.startsWith('/api/')) throw new Error('只读页面不支持此操作。');
    if (url.pathname !== '/api/projects' && !url.searchParams.has('project')) url.searchParams.set('project', data.default_project);
    if (['/api/graph', '/api/map-focus', '/api/derivation'].includes(url.pathname) && !url.searchParams.has('layer')) url.searchParams.set('layer', 'research');
    url.searchParams.sort();
    const route = url.pathname + '?' + url.searchParams.toString();
    if (!(route in data.routes)) { const e = new Error('此内容不在只读快照中。'); e.status = 404; throw e; }
    return structuredClone(data.routes[route]);
  };
})();
