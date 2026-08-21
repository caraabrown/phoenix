(function () {
  'use strict';

  var PLAY_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#8ecdfb"><polygon points="8,4 20,12 8,20"></polygon></svg>';
  var PAUSE_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#8ecdfb"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
  var MUTE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8ecdfb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
  var UNMUTE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8ecdfb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 010 7.07"></path><path d="M19.07 4.93a10 10 0 010 14.14"></path></svg>';
  var SMS_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f0e6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>';
  var MAIL_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f0e6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><polyline points="22,6 12,13 2,6"></polyline></svg>';
  var IG_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f0e6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>';

  var TRACKS = [
    { name: 'Light Side of the Moon', url: 'https://soundcloud.com/phoenixrox/light-side-of-the-moon-phoenix' },
    { name: 'Stars & Pipes', url: 'local:stars-pipes' },
    { name: 'Love Sick', url: 'https://soundcloud.com/phoenixrox/love-sick-pt-1' },
    { name: 'Welcome to the Zoo', url: 'https://soundcloud.com/phoenixrox/welcome-to-the-zoo' },
    { name: 'I am Your Creative Avenger', url: 'https://soundcloud.com/americandreamingmagazine/im-your-creative-avenger' },
    { name: 'Whaat!', url: 'https://soundcloud.com/phoenixrox/whaaaa' },
    { name: 'Do That Shit Then', url: 'https://soundcloud.com/phoenixrox/do-that-then' }
  ];

  var LOVE_SICK_URL = 'https://soundcloud.com/phoenixrox/love-sick-pt-1';
  var BG_PAGES = { music: 'assets/bg-music.jpg', about: 'assets/bg-about.png' };
  var PREFIXES = { about: 'About', music: 'Music by', cv: 'Experience Work by', booking: 'Contact' };
  var NAV_MAP = {
    home: [['About', 'about'], ['Music', 'music'], ['CV', 'cv'], ['Contact', 'booking']],
    about: [['Home', 'home'], ['Music', 'music'], ['CV', 'cv'], ['Contact', 'booking']],
    music: [['Home', 'home'], ['About', 'about'], ['CV', 'cv'], ['Contact', 'booking']],
    cv: [['Home', 'home'], ['About', 'about'], ['Music', 'music'], ['Contact', 'booking']],
    booking: [['About', 'about'], ['Music', 'music'], ['CV', 'cv']]
  };
  var CONTENT_FADE_MS = 2000;

  var state = { page: 'home', transitioning: false, scPlaying: false, scProgress: 0, scTime: '0:00', scDuration: 0, currentTrackUrl: TRACKS[0].url, bgMuted: false, localTrack: false, contactAudioOff: false };
  var el = {};
  var scWidget = null, scInitAttempts = 0;
  var bgPlayer = null, bgInitAttempts = 0, bgCurrentId = null, reel = null, reelIndex = 0;
  var bgLayerEls = null, bgTopLayer = 0, bgImageShown = false;
  var bgAdvanceTimer = null;
  var contactAudioTimer = null, contactAudioFadeRAF = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    el.bgBlackOverlay = document.getElementById('bg-black-overlay');
    el.bgImage = document.getElementById('bg-image');
    el.bgImageOverlay = document.getElementById('bg-image-overlay');
    bgLayerEls = [0, 1].map(function (i) {
      var root = document.getElementById('bg-layer-' + i);
      return {
        root: root,
        plain: root.querySelector('.bg-image-plain'),
        stack: root.querySelector('.bg-image-stack'),
        stackItems: Array.prototype.slice.call(root.querySelectorAll('.stack-item'))
      };
    });
    el.bgVideo = document.getElementById('bg-video');
    el.bgVimeoIframe = document.getElementById('bg-vimeo-iframe');
    el.bgMuteBtn = document.getElementById('bg-mute-btn');
    el.prefix = document.getElementById('prefix');
    el.content = document.getElementById('content');
    el.nav = document.getElementById('nav-list');
    el.pageFade = document.getElementById('page-fade');
    el.navWrap = document.querySelector('nav');

    el.bgMuteBtn.innerHTML = UNMUTE_ICON;
    el.bgMuteBtn.addEventListener('click', toggleBgMute);

    var sp = document.getElementById('stars-pipes-audio');
    if (sp) {
      sp.addEventListener('timeupdate', function () {
        if (!state.localTrack || !sp.duration) return;
        state.scProgress = (sp.currentTime / sp.duration) * 100;
        state.scTime = fmt(sp.currentTime * 1000);
        updatePlayerUI();
      });
      sp.addEventListener('ended', function () {
        if (!state.localTrack) return;
        state.scPlaying = false;
        updatePlayerUI();
      });
    }

    initSC();
    renderPage();
  }

  function setPageOpacity(v) {
    [el.prefix, el.content, el.navWrap].forEach(function (n) { if (n) n.style.opacity = v; });
  }

  function fmt(ms) {
    var t = Math.floor(ms / 1000), m = Math.floor(t / 60), s = t % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function initSC() {
    if (scWidget || scInitAttempts > 20) return;
    scInitAttempts++;
    if (!window.SC || !window.SC.Widget) { setTimeout(initSC, 500); return; }
    var iframe = document.getElementById('sc-iframe');
    if (!iframe) { setTimeout(initSC, 500); return; }
    try {
      scWidget = SC.Widget(iframe);
      scWidget.bind(SC.Widget.Events.READY, function () {
        scWidget.getDuration(function (d) { state.scDuration = d; });
      });
      scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, function (data) {
        if (state.scDuration) {
          state.scProgress = (data.currentPosition / state.scDuration) * 100;
          state.scTime = fmt(data.currentPosition);
          updatePlayerUI();
        }
      });
      scWidget.bind(SC.Widget.Events.FINISH, function () { state.scPlaying = false; updatePlayerUI(); });
    } catch (e) {
      scWidget = null;
      setTimeout(initSC, 1000);
    }
  }

  function pauseMainPlayer() {
    if (state.localTrack) {
      var sp = document.getElementById('stars-pipes-audio');
      if (sp) sp.pause();
      state.scPlaying = false;
      updatePlayerUI();
      return;
    }
    if (scWidget && state.scPlaying) { scWidget.pause(); state.scPlaying = false; updatePlayerUI(); }
  }

  function togglePlay() {
    if (state.localTrack) {
      var sp = document.getElementById('stars-pipes-audio');
      if (!sp) return;
      if (state.scPlaying) sp.pause(); else sp.play().catch(function () {});
      state.scPlaying = !state.scPlaying;
      updatePlayerUI();
      return;
    }
    if (!scWidget) return;
    if (state.scPlaying) scWidget.pause(); else scWidget.play();
    state.scPlaying = !state.scPlaying;
    updatePlayerUI();
  }

  function seekTo(e) {
    var rect = e.currentTarget.getBoundingClientRect();
    if (state.localTrack) {
      var sp = document.getElementById('stars-pipes-audio');
      if (!sp || !sp.duration) return;
      sp.currentTime = ((e.clientX - rect.left) / rect.width) * sp.duration;
      return;
    }
    if (!scWidget || !state.scDuration) return;
    scWidget.seekTo(((e.clientX - rect.left) / rect.width) * state.scDuration);
  }

  function fadeOutAlbumArt() {
    var img = el.content.querySelector('.album-art');
    if (!img) return;
    var r = img.getBoundingClientRect();
    var ghost = img.cloneNode(true);
    ghost.className = 'album-art-ghost';
    ghost.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width +
      'px;height:' + r.height + 'px;object-fit:cover;z-index:3;pointer-events:none;opacity:1;transition:opacity 2000ms ease-in-out;';
    document.body.appendChild(ghost);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ghost.style.opacity = '0'; });
    });
    setTimeout(function () { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); }, 2100);
  }

  function loadTrack(track) {
    if (track.url === state.currentTrackUrl) return;
    var isLocal = track.name === 'Stars & Pipes';
    if (!isLocal && (!track.url || !scWidget)) return;
    if (state.currentTrackUrl === LOVE_SICK_URL && track.url !== LOVE_SICK_URL) fadeOutAlbumArt();
    if (isLocal) {
      if (scWidget) scWidget.pause();
      state.localTrack = true;
      state.currentTrackUrl = track.url;
      showStarsAndPipesImage(null, true);
    } else {
      stopStarsAndPipesAudio();
      var topLayer = bgLayerEls[bgTopLayer];
      var atMusicBg = bgImageIsActive() &&
        topLayer.plain.style.display !== 'none' &&
        topLayer.plain.style.backgroundImage.indexOf(BG_PAGES.music) !== -1;
      if (!atMusicBg) {
        resetBgVideoState();
        showCvBgImage(BG_PAGES.music, { size: 'cover', overlay: 0.65 });
      }
      
      state.localTrack = false;
      scWidget.load(track.url, { auto_play: true, callback: function () {
        scWidget.getDuration(function (d) { state.scDuration = d; });
      } });
      state.currentTrackUrl = track.url;
    }
    state.scPlaying = true;
    state.scProgress = 0;
    state.scTime = '0:00';
    el.content.innerHTML = musicHTML();
    attachPageListeners();
  }

  function updatePlayerUI() {
    var btn = document.getElementById('play-btn');
    if (!btn) return;
    btn.innerHTML = state.scPlaying ? PAUSE_ICON : PLAY_ICON;
    var fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = state.scProgress + '%';
    var time = document.getElementById('time-label');
    if (time) time.textContent = state.scTime;
  }

  function playContactAudio() {
    var audio = document.getElementById('contact-audio');
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = 1;
    audio.play().catch(function () {});
    if (contactAudioTimer) clearTimeout(contactAudioTimer);
    if (contactAudioFadeRAF) cancelAnimationFrame(contactAudioFadeRAF);
    var fadeMs = 2000;
    var schedule = function () {
      var totalMs = (audio.duration && isFinite(audio.duration)) ? audio.duration * 1000 : 29000;
      contactAudioTimer = setTimeout(function () {
        var startVol = audio.volume;
        var startTime = performance.now();
        function step(now) {
          var t = Math.min(1, (now - startTime) / fadeMs);
          audio.volume = startVol * (1 - t);
          if (t < 1) contactAudioFadeRAF = requestAnimationFrame(step);
          else { audio.pause(); audio.currentTime = 0; }
        }
        contactAudioFadeRAF = requestAnimationFrame(step);
      }, Math.max(totalMs - fadeMs, 0));
    };
    if (audio.duration && isFinite(audio.duration)) schedule();
    else audio.addEventListener('loadedmetadata', schedule, { once: true });
  }

  function stopContactAudio() {
    var audio = document.getElementById('contact-audio');
    if (contactAudioTimer) { clearTimeout(contactAudioTimer); contactAudioTimer = null; }
    if (contactAudioFadeRAF) { cancelAnimationFrame(contactAudioFadeRAF); contactAudioFadeRAF = null; }
    if (audio) { audio.pause(); audio.currentTime = 0; }
  }

  function stopStarsAndPipesAudio() {
    var audio = document.getElementById('stars-pipes-audio');
    if (audio) { audio.pause(); audio.currentTime = 0; }
    if (state.localTrack) { state.scPlaying = false; updatePlayerUI(); }
  }

  function clearBgAdvanceTimer() { if (bgAdvanceTimer) { clearTimeout(bgAdvanceTimer); bgAdvanceTimer = null; } }

  var bgImageHideTimer = null, bgVideoHideTimer = null;

  function hideBgImage(instant) {
    if (bgImageHideTimer) { clearTimeout(bgImageHideTimer); bgImageHideTimer = null; }
    bgImageShown = false;
    if (instant) { el.bgImage.classList.remove('active'); el.bgImage.style.opacity = '0'; return; }
    el.bgImage.style.transition = 'opacity 2000ms ease-in-out';
    el.bgImage.style.opacity = '0';
    bgImageHideTimer = setTimeout(function () {
      el.bgImage.classList.remove('active');
      bgImageHideTimer = null;
    }, 2000);
  }
  function hideBgVideo(instant) {
    if (bgVideoHideTimer) { clearTimeout(bgVideoHideTimer); bgVideoHideTimer = null; }
    el.bgMuteBtn.classList.remove('active');
    if (instant) { el.bgVideo.classList.remove('active'); el.bgVideo.style.opacity = '0'; return; }
    el.bgVideo.style.transition = 'opacity 2000ms ease-in-out';
    el.bgVideo.style.opacity = '0';
    bgVideoHideTimer = setTimeout(function () {
      el.bgVideo.classList.remove('active');
      bgVideoHideTimer = null;
    }, 2000);
  }
  function resetBgVideoState(instant) {
    reel = null;
    if (bgPlayer) { try { bgPlayer.setVolume(0); bgPlayer.pause(); } catch (err) {} }
    bgPlayer = null;
    bgCurrentId = null;
    clearBgAdvanceTimer();
    hideBgVideo(instant);
  }

  function showCvBgImage(url, opts) {
    opts = opts || {};
    var incoming = bgImageShown ? (bgTopLayer === 0 ? 1 : 0) : bgTopLayer;
    var outgoing = incoming === 0 ? 1 : 0;
    var layer = bgLayerEls[incoming];
    layer.stack.style.display = opts.stacked ? 'flex' : 'none';
    layer.plain.style.display = opts.stacked ? 'none' : 'block';
    if (opts.stacked) {
      layer.stackItems.forEach(function (item) { item.style.backgroundImage = "url('" + url + "')"; });
    } else {
      layer.plain.style.backgroundImage = "url('" + url + "')";
      layer.plain.style.backgroundSize = opts.size || 'contain';
      layer.plain.style.backgroundPosition = opts.position || (opts.size === 'cover' ? 'center center' : 'center right');
    }
    el.bgImageOverlay.style.transition = 'background-color 2000ms ease-in-out';
    el.bgImageOverlay.style.background = 'rgba(0,0,0,' + (opts.overlay != null ? opts.overlay : 0.65) + ')';
    if (bgImageHideTimer) { clearTimeout(bgImageHideTimer); bgImageHideTimer = null; }
    var wasHidden = !el.bgImage.classList.contains('active');
    el.bgImage.classList.add('active');
    el.bgImage.style.transition = 'opacity 2000ms ease-in-out';
    if (wasHidden) el.bgImage.style.opacity = '0';
    layer.root.style.transition = 'none';
    layer.root.style.opacity = '0';
    void layer.root.offsetHeight;
    bgLayerEls[outgoing].root.style.zIndex = '1';
    layer.root.style.zIndex = '2';
    layer.root.style.transition = 'opacity 2000ms ease-in-out';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.bgImage.style.opacity = '1';
        layer.root.style.opacity = '1';
      });
    });
    bgTopLayer = incoming;
    bgImageShown = true;
    if (opts.sequence) runBgSequence();
  }

  function runBgSequence() {}

  function showMightyAphroditeImage(e) { if (e) e.preventDefault(); pauseMainPlayer(); stopStarsAndPipesAudio(); resetBgVideoState(); showCvBgImage('assets/mighty-aphrodite.png', { stacked: true, overlay: 0.65 }); }
  function showGuessImage(e) { if (e) e.preventDefault(); pauseMainPlayer(); stopStarsAndPipesAudio(); resetBgVideoState(); showCvBgImage('assets/guess-dj.jpg', { stacked: true, overlay: 0.65 }); }
  function showLamontBishopImage(e) { if (e) e.preventDefault(); pauseMainPlayer(); stopStarsAndPipesAudio(); resetBgVideoState(); showCvBgImage('assets/lamont-bishop.png', { size: 'contain', overlay: 0.65 }); }
  function showAmericanDreamingImage(e) { if (e) e.preventDefault(); pauseMainPlayer(); stopStarsAndPipesAudio(); resetBgVideoState(); showCvBgImage('assets/american-dreaming.png', { size: 'cover', overlay: 0.72 }); }
  function showStarsAndPipesImage(e, skipSequence) {
    if (e) e.preventDefault();
    pauseMainPlayer();
    resetBgVideoState();
    var audio = document.getElementById('stars-pipes-audio');
    if (audio) { audio.currentTime = 0; audio.play().catch(function () {}); }
    showCvBgImage('assets/musicstarsandpipes.JPG', { size: 'cover', overlay: 0.65, duration: 3000, sequence: !skipSequence });
  }
  function setBgVideoIframeSrc(id, start) {
    el.bgVimeoIframe.src = 'https://player.vimeo.com/video/' + id + '?autoplay=0&muted=1&controls=0&dnt=1&background=0' +
      (start > 0 ? '#t=' + start + 's' : '');
  }

  function playBgVideo(id, start, end) {
    reel = null;
    pauseMainPlayer();
    stopStarsAndPipesAudio();
    stopContactAudio();
    state.bgMuted = false;
    el.bgMuteBtn.innerHTML = UNMUTE_ICON;
    if (bgPlayer && bgCurrentId && el.bgVideo.classList.contains('active')) {
      clearBgAdvanceTimer();
      crossfadeTo(id, start, end, 800);
    } else {
      playClip(id, start, end, true);
    }
  }

  function playReel(e, skipSequence) {
    if (e) e.preventDefault();
    pauseMainPlayer();
    stopStarsAndPipesAudio();
    state.bgMuted = false;
    el.bgMuteBtn.innerHTML = UNMUTE_ICON;
    reel = [
      { id: '90561744', start: 0, end: 75 },
      { id: '33052855', start: 11, end: 41 },
      { id: '39578046', start: 81, end: 114 },
      { id: '10589479', start: 9, end: 69 }
    ];
    reelIndex = 0;
    var first = reel[0];
    playClip(first.id, first.start, first.end, true, skipSequence);
  }

  function playClip(id, start, end, isFirstFade, skipSequence) {
    if (bgVideoHideTimer) { clearTimeout(bgVideoHideTimer); bgVideoHideTimer = null; }
    var fadeIn = function () {
      hideBgImage();
      el.bgVideo.style.transition = 'opacity 2000ms ease-in-out';
      el.bgVideo.style.opacity = '1';
      el.bgMuteBtn.classList.add('active');
    };
    var startPlayback = function () {
      var player = bgPlayer;
      player.setVolume(0);
      if (player.pause) { try { player.pause(); } catch (err) {} }
      var proceed = function () {
        var p = player.play();
        var unmute = function () {
          if (!state.bgMuted) player.setVolume(0.4);
          if (isFirstFade) fadeIn();
        };
        var playDone = (p && p.then) ? p.catch(function () {}) : Promise.resolve();
        var playTimeout = new Promise(function (res) { setTimeout(res, 500); });
        Promise.race([playDone, playTimeout]).then(unmute);
      };
      var seek = player.setCurrentTime(start).catch(function () {});
      var timeout = new Promise(function (res) { setTimeout(res, 800); });
      Promise.race([seek, timeout]).then(proceed);
      scheduleAdvance(id, start, end);
    };
    if (bgPlayer && bgCurrentId) {
      if (bgCurrentId === id) startPlayback();
      else bgPlayer.loadVideo(id).then(function () { bgCurrentId = id; startPlayback(); });
      if (isFirstFade) {
        el.bgVideo.classList.add('active');
        el.bgVideo.style.transition = 'none';
        el.bgVideo.style.opacity = '0';
        void el.bgVideo.offsetHeight;
        if (!skipSequence) runBgSequence();
      }
    } else {
      bgInitAttempts = 0;
      setBgVideoIframeSrc(id, start);
      el.bgVideo.classList.add('active');
      el.bgVideo.style.transition = 'none';
      el.bgVideo.style.opacity = '0';
      void el.bgVideo.offsetHeight;
      initBgPlayer(function () { bgCurrentId = id; startPlayback(); });
      if (isFirstFade && !skipSequence) runBgSequence();
    }
  }

  function fadeVolume(from, to, duration, cb) {
    var steps = 10, stepMs = duration / steps, i = 0;
    function run() {
      i++;
      var v = from + (to - from) * (i / steps);
      if (bgPlayer) bgPlayer.setVolume(Math.max(0, v));
      if (i < steps) setTimeout(run, stepMs); else if (cb) cb();
    }
    run();
  }

  function scheduleAdvance(id, start, end) {
    clearBgAdvanceTimer();
    var total = (end - start) * 1000;
    var fadeMs = Math.min(1000, total / 3);
    bgAdvanceTimer = setTimeout(function () {
      var next;
      if (reel) { reelIndex = (reelIndex + 1) % reel.length; next = reel[reelIndex]; }
      else next = { id: id, start: start, end: end };
      crossfadeTo(next.id, next.start, next.end, fadeMs);
    }, Math.max(total - fadeMs, 0));
  }

  function crossfadeTo(id, start, end, fadeMs) {
    if (bgVideoHideTimer) { clearTimeout(bgVideoHideTimer); bgVideoHideTimer = null; }
    fadeMs = fadeMs || 1000;
    var targetVol = state.bgMuted ? 0 : 0.4;
    fadeVolume(targetVol, 0, fadeMs, function () {
      setTimeout(function () {
        var seekAndPlay = function () {
          var player = bgPlayer;
          player.setVolume(0);
          if (player.pause) { try { player.pause(); } catch (err) {} }
          var proceed = function () {
            var p = player.play();
            var unmute = function () { if (!state.bgMuted) fadeVolume(0, 0.4, fadeMs); };
            var playDone = (p && p.then) ? p.catch(function () {}) : Promise.resolve();
            var playTimeout = new Promise(function (res) { setTimeout(res, 500); });
            Promise.race([playDone, playTimeout]).then(unmute);
            el.bgVideo.style.opacity = '1';
          };
          var seek = player.setCurrentTime(start).catch(function () {});
          var timeout = new Promise(function (res) { setTimeout(res, 800); });
          Promise.race([seek, timeout]).then(proceed);
          scheduleAdvance(id, start, end);
        };
        if (bgCurrentId === id) seekAndPlay();
        else bgPlayer.loadVideo(id).then(function () { bgCurrentId = id; seekAndPlay(); });
      }, 500);
    });
  }

  function initBgPlayer(onReady) {
    if (bgPlayer || bgInitAttempts > 20) return;
    bgInitAttempts++;
    if (!window.Vimeo || !window.Vimeo.Player) { setTimeout(function () { initBgPlayer(onReady); }, 250); return; }
    try {
      bgPlayer = new Vimeo.Player(el.bgVimeoIframe);
      bgPlayer.ready().then(onReady).catch(function () {
        bgPlayer = null;
        setTimeout(function () { initBgPlayer(onReady); }, 500);
      });
    } catch (e) {
      bgPlayer = null;
      setTimeout(function () { initBgPlayer(onReady); }, 500);
    }
  }

  function toggleBgMute() {
    if (state.page === 'booking') { toggleContactAudio(); return; }
    if (!bgPlayer) return;
    var next = !state.bgMuted;
    fadeVolume(next ? 0.4 : 0, next ? 0 : 0.4, 300);
    state.bgMuted = next;
    el.bgMuteBtn.innerHTML = next ? MUTE_ICON : UNMUTE_ICON;
  }

  function bgImageIsActive() { return el.bgImage.classList.contains('active'); }

  function navigate(page) {
    if (page === state.page || state.transitioning) return;
    var enteringBooking = page === 'booking' && state.page !== 'booking';
    var wasCv = state.page === 'cv';
    var leavingMusic = state.page === 'music' && page !== 'music';
    var leavingBg = BG_PAGES[state.page] && !BG_PAGES[page] && bgImageIsActive();
    var enteringBg = BG_PAGES[page] && page !== state.page;
    var destHasBg = !!BG_PAGES[page] || page === 'cv';

    state.transitioning = true;
    pauseMainPlayer();
    stopStarsAndPipesAudio();
    stopContactAudio();
    setPageOpacity('0');

    setTimeout(function () {
      state.page = page;
      state.transitioning = false;
      pauseMainPlayer();
      stopStarsAndPipesAudio();
      if (!destHasBg) {
        hideBgImage();
        resetBgVideoState();
        el.bgBlackOverlay.style.opacity = '0';
      } else {        clearBgAdvanceTimer();
        if (page !== 'cv') resetBgVideoState();
        if (leavingMusic) el.bgBlackOverlay.style.opacity = '0';
      }
      if (enteringBg) {
        pauseMainPlayer();
        showCvBgImage(BG_PAGES[page], { size: 'cover', overlay: 0.65, position: page === 'about' ? 'center 12%' : 'center center' });
      }
      if (page === 'cv') playReel(null, true);
      renderPage();
      setPageOpacity('1');
      if (enteringBooking && !state.contactAudioOff) playContactAudio();
    }, CONTENT_FADE_MS);
  }

  function updateHeader() {
    var p = state.page;
    el.prefix.textContent = PREFIXES[p] || 'Home';
    el.prefix.style.visibility = p !== 'home' ? 'visible' : 'hidden';
  }

  function updateNav() {
    var p = state.page;
    var items = NAV_MAP[p] || NAV_MAP.home;
    var html = items.map(function (i) {
      return '<li><button type="button" data-nav-target="' + i[1] + '">' + i[0] + '</button></li>';
    }).join('');
    if (p === 'booking') {
      html += '<li><a href="sms:2024899901" class="icon-link" aria-label="Send text message">' + SMS_ICON + '</a></li>';
      html += '<li><a href="mailto:phoenixroxme@gmail.com" class="icon-link" aria-label="Send email">' + MAIL_ICON + '</a></li>';
      html += '<li><a href="https://www.instagram.com/phoenixrox.me/" target="_blank" rel="noopener" class="icon-link" aria-label="Instagram">' + IG_ICON + '<span style="font-family:Raleway, sans-serif; font-weight:300; font-size:13px; letter-spacing:1px">@phoenixrox.me</span></a></li>';
    }
    el.nav.innerHTML = html;
    el.nav.querySelectorAll('[data-nav-target]').forEach(function (btn) {
      btn.addEventListener('click', function () { navigate(btn.getAttribute('data-nav-target')); });
    });
  }

  function aboutHTML() {
    return '<div class="about-block">' +
      '<p>Phoenix engages audiences by crafting unique listening experiences by blending beats and harmonies, mixing genres; conveying a bevy of feelings and moods. Incorporating user experience design methods Phoenix stands out and leaves people asking &ldquo;Oooh, what song is this?!&rdquo;</p>' +
      '<p>Phoenix is currently working on a book with her music mentor, <a href="https://www.kennedy-center.org/artists/l/lo-lz/adrian-loving/" target="_blank" rel="noopener" title="linktr.ee/soulbrother71">Adrian Loving</a> and legendary celebrity hair stylist Diamond Ken.</p>' +
      '<div class="signup">' +
        '<p>Get notified when it&rsquo;s released</p>' +
        '<form id="signup-form">' +
          '<input type="email" id="signup-email" placeholder="Email">' +
          '<input type="tel" id="signup-phone" placeholder="Phone (for text updates)">' +
          '<button type="submit">Sign Up</button>' +
        '</form>' +
        '<p class="signup-thanks" id="signup-thanks" style="display:none">Thanks &mdash; you&rsquo;re on the list.</p>' +
      '</div>' +
    '</div>';
  }

  function musicHTML() {
    var isLoveSick = state.currentTrackUrl === LOVE_SICK_URL;
    el.bgBlackOverlay.style.opacity = isLoveSick ? '1' : '0';
    var albumArt = '<div class="album-art-slot">' + (isLoveSick ? '<img src="assets/love-sick-album-art.jpg" alt="Love Sick album art" class="album-art">' : '') + '</div>';
    var tracksHtml = TRACKS.map(function (t) {
      var hasUrl = !!t.url || t.name === 'Stars & Pipes';
      var active = t.url === state.currentTrackUrl;
      var cls = active ? 'active' : (hasUrl ? '' : 'disabled');
      return '<li><button type="button" class="' + cls + '" data-track="' + t.name + '">' + t.name + '</button></li>';
    }).join('');
    return '<div class="music-block">' + albumArt +
      '<div class="player-row">' +
        '<button type="button" class="play-btn" id="play-btn" aria-label="Play or pause">' + (state.scPlaying ? PAUSE_ICON : PLAY_ICON) + '</button>' +
        '<div class="progress-track" id="progress-track"><div class="progress-fill" id="progress-fill" style="width:' + state.scProgress + '%"></div></div>' +
        '<span class="time-label" id="time-label">' + state.scTime + '</span>' +
      '</div>' +
      '<ul class="track-list">' + tracksHtml + '</ul>' +
    '</div>';
  }

  function cvHTML() {
    return '<div class="cv-block">' +
      '<div class="cv-col">' +
        '<span class="cv-label">Work</span>' +
        '<ul>' +
          '<li><a href="https://vimeo.com/33052855?fl=pl&fe=sh" data-action="paradise" rel="noopener">Music Director, Paradise City Documentary</a></li>' +
          '<li><a href="#" data-action="american-dreaming" rel="noopener">Music Director, American Dreaming Magazine</a></li>' +
          '<li><a href="https://vimeo.com/manage/videos/39578046" data-action="forgiato" rel="noopener">Forgiato Commercial</a>, <em>Director <a href="https://www.avicohen.tv/" target="_blank" rel="noopener">Avi Cohen</a></em></li>' +
          '<li><a href="https://vimeo.com/90561744?fl=pl&fe=sh" data-action="kami" rel="noopener">Music Director, Kami Designs</a></li>' +
          '<li><a href="#" data-action="stars-pipes" rel="noopener">Curator, Stars &amp; Pipes: An Exploration of Drugs in America</a>, <em>w/ photographer <a href="https://vimeo.com/7495158?fl=pl&fe=sh" data-action="thi-chien" rel="noopener">Thi Chien</a></em></li>' +
          '<li>DC Commission on the Arts &amp; Humanities, grant recipient</li>' +
        '</ul>' +
        '<span class="cv-label">Media</span>' +
        '<ul>' +
          '<li>DC Modern Luxury Magazine</li>' +
          '<li>American Dreaming Magazine</li>' +
        '</ul>' +
      '</div>' +
      '<div class="cv-col">' +
        '<span class="cv-label">Performance</span>' +
        '<ul>' +
          '<li>Warner Music Group &amp; Six Flags</li>' +
          '<li>Hello Stranger w/ <a href="https://www.instagram.com/djmindmotion1/" target="_blank" rel="noopener">Mind Motion</a></li>' +
          '<li>The Smugger</li>' +
          '<li><a href="#" data-action="mighty-aphrodite" rel="noopener">Mighty Aphrodite</a></li>' +
          '<li>Recess DC</li>' +
          '<li>Oakland Unified Public School District</li>' +
          '<li>DC Fashion Council</li>' +
          '<li><a href="https://www.instagram.com/pinklineproject/" target="_blank" rel="noopener">The Pink Line Project</a></li>' +
        '</ul>' +
        '<span class="cv-label">Resident Music Selector</span>' +
        '<ul>' +
          '<li><a href="#" data-action="guess" rel="noopener">Guess Clothing Brand</a></li>' +
          '<li>The Smithsonian Textile Museum</li>' +
          '<li><a href="#" data-action="lamont-bishop" rel="noopener">Lamont Bishop Gallery</a></li>' +
          '<li>Vince Gray for (DC) Mayor Campaign</li>' +
          '<li><a href="https://www.instagram.com/bensnextdoordc/?hl=en" target="_blank" rel="noopener">Ben&rsquo;s Next Door</a></li>' +
        '</ul>' +
      '</div>' +
    '</div>';
  }

  function bookingHTML() { return ''; }

  function updateContactMuteBtn() {
    el.bgMuteBtn.classList.add('active');
    el.bgMuteBtn.innerHTML = state.contactAudioOff ? MUTE_ICON : UNMUTE_ICON;
  }

  function toggleContactAudio() {
    state.contactAudioOff = !state.contactAudioOff;
    if (state.contactAudioOff) stopContactAudio();
    else playContactAudio();
    updateContactMuteBtn();
  }

  function bindAction(name, handler) {
    var target = el.content.querySelector('[data-action="' + name + '"]');
    if (target) target.addEventListener('click', handler);
  }

  function submitSignup(e) {
    e.preventDefault();
    var email = document.getElementById('signup-email').value;
    var phone = document.getElementById('signup-phone').value;
    if (!email && !phone) return;
    var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx1sgJzVv8jAgAuQq7YL1bah7zXlTUfIif9AX2WzYu9gSyPrZBwYxsYwUnPfCS-94pZ6w/exec';
    fetch(WEB_APP_URL, {
      method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ email: email, phone: phone })
    }).catch(function () {});
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('signup-thanks').style.display = 'block';
  }

  function attachPageListeners() {
    var page = state.page;
    if (page === 'about') {
      document.getElementById('signup-form').addEventListener('submit', submitSignup);
    } else if (page === 'music') {
      document.getElementById('play-btn').addEventListener('click', togglePlay);
      document.getElementById('progress-track').addEventListener('click', seekTo);
      el.content.querySelectorAll('[data-track]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var track = TRACKS.filter(function (t) { return t.name === btn.getAttribute('data-track'); })[0];
          if (track) loadTrack(track);
        });
      });
    } else if (page === 'cv') {
      bindAction('paradise', function (e) { e.preventDefault(); playBgVideo('33052855', 11, 56); });
      bindAction('american-dreaming', showAmericanDreamingImage);
      bindAction('forgiato', function (e) { e.preventDefault(); playBgVideo('39578046', 81, 114); });
      bindAction('kami', function (e) { e.preventDefault(); playBgVideo('90561744', 0, 92); });
      bindAction('stars-pipes', function (e) { e.preventDefault(); playBgVideo('10589479', 0, 42); });
      bindAction('thi-chien', function (e) { e.preventDefault(); playBgVideo('7495158', 18, 56); });
      bindAction('mighty-aphrodite', showMightyAphroditeImage);
      bindAction('guess', showGuessImage);
      bindAction('lamont-bishop', showLamontBishopImage);
    } else if (page === 'booking') {
      updateContactMuteBtn();
    }
  }

  function renderPage() {
    updateNav();
    updateHeader();
    var page = state.page;
    if (page === 'about') el.content.innerHTML = aboutHTML();
    else if (page === 'music') el.content.innerHTML = musicHTML();
    else if (page === 'cv') el.content.innerHTML = cvHTML();
    else if (page === 'booking') el.content.innerHTML = bookingHTML();
    else el.content.innerHTML = '';
    attachPageListeners();
  }
})();
