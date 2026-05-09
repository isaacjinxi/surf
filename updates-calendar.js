(function () {
  var mount = document.getElementById("calendar-mount");
  var label = document.getElementById("cal-month-label");
  var viewport = document.getElementById("calendar-viewport");
  var dock = document.getElementById("updates-dock");
  var surface = document.getElementById("updates-dock-surface");
  var btnPrev = document.getElementById("cal-prev-month");
  var btnNext = document.getElementById("cal-next-month");
  var swipeTrack = document.getElementById("events-swipe-track");

  var mqCompact = window.matchMedia("(max-width: 520px)");
  function isCompact() {
    return mqCompact.matches;
  }

  if (!dock || !surface || !swipeTrack) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function eventKey(year, month0, day) {
    return year + "-" + month0 + "-" + day;
  }

  var EVENTS = {};
  EVENTS[eventKey(2026, 3, 27)] = {
    marker: "Meeting",
    title: "Meeting",
    body:
      "We met up for our first formal meeting. We discussed name ideas and future plans. We also learned more about FTC.",
  };

  function sortedEventEntries() {
    return Object.keys(EVENTS)
      .sort(function (a, b) {
        var pa = a.split("-").map(Number);
        var pb = b.split("-").map(Number);
        for (var i = 0; i < 3; i++) {
          if (pa[i] !== pb[i]) return pa[i] - pb[i];
        }
        return 0;
      })
      .map(function (key) {
        var parts = key.split("-").map(Number);
        var y = parts[0];
        var m0 = parts[1];
        var day = parts[2];
        return {
          key: key,
          dateLabel: monthNames[m0] + " " + day + ", " + y,
          ev: EVENTS[key],
        };
      });
  }

  function renderEventsSwipe() {
    swipeTrack.innerHTML = "";
    var list = sortedEventEntries();
    if (!list.length) {
      var emptySlide = document.createElement("article");
      emptySlide.className = "events-slide";
      var ep = document.createElement("p");
      ep.className = "events-slide-body";
      ep.textContent = "No updates yet.";
      emptySlide.appendChild(ep);
      swipeTrack.appendChild(emptySlide);
      return;
    }
    list.forEach(function (item) {
      var slide = document.createElement("article");
      slide.className = "events-slide";
      slide.setAttribute("role", "group");
      slide.setAttribute(
        "aria-label",
        item.dateLabel + ", " + item.ev.title
      );

      var dateEl = document.createElement("p");
      dateEl.className = "events-slide-date";
      dateEl.textContent = item.dateLabel;

      var mk = document.createElement("span");
      mk.className = "events-slide-marker";
      mk.textContent = item.ev.marker;

      var h = document.createElement("h4");
      h.className = "events-slide-title";
      h.textContent = item.ev.title;

      var p = document.createElement("p");
      p.className = "events-slide-body";
      p.textContent = item.ev.body;

      slide.appendChild(dateEl);
      slide.appendChild(mk);
      slide.appendChild(h);
      slide.appendChild(p);
      swipeTrack.appendChild(slide);
    });
  }

  var viewYear = 2026;
  var viewMonth = 3;
  var selected = null;
  var calendarInitialized = mount && label && viewport && btnPrev && btnNext;

  function daysInMonth(year, month0) {
    return new Date(year, month0 + 1, 0).getDate();
  }

  function weekdayOfFirst(year, month0) {
    return new Date(year, month0, 1).getDay();
  }

  function clearSurface() {
    surface.textContent = "";
  }

  function fillIdleContent() {
    clearSurface();
    var p = document.createElement("p");
    p.className = "updates-dock-message";
    p.textContent = "Select a date";
    surface.appendChild(p);
  }

  function fillNothingContent() {
    clearSurface();
    var p = document.createElement("p");
    p.className = "updates-dock-message updates-dock-message--muted";
    p.textContent = "Nothing happened";
    surface.appendChild(p);
  }

  function fillEventContent(ev) {
    clearSurface();
    var h = document.createElement("h4");
    h.className = "updates-dock-title";
    h.textContent = ev.title;
    var p = document.createElement("p");
    p.className = "updates-dock-desc";
    p.textContent = ev.body;
    surface.appendChild(h);
    surface.appendChild(p);
  }

  function runSurfaceAnimation(fillFn, skipAnimation) {
    if (reduceMotion || skipAnimation) {
      fillFn();
      return;
    }
    surface.classList.remove("updates-dock-surface--in");
    surface.classList.add("updates-dock-surface--out");
    surface.addEventListener(
      "animationend",
      function onOut() {
        surface.removeEventListener("animationend", onOut);
        fillFn();
        surface.classList.remove("updates-dock-surface--out");
        void surface.offsetWidth;
        surface.classList.add("updates-dock-surface--in");
        surface.addEventListener(
          "animationend",
          function onIn() {
            surface.removeEventListener("animationend", onIn);
            surface.classList.remove("updates-dock-surface--in");
          },
          { once: true }
        );
      },
      { once: true }
    );
  }

  function updateDock(fillFn, skipAnimation) {
    if (isCompact()) return;
    runSurfaceAnimation(fillFn, skipAnimation);
  }

  function dateSelected(y, m0, d) {
    return selected && selected.y === y && selected.m === m0 && selected.d === d;
  }

  function onPickDay(day) {
    if (isCompact()) return;
    selected = { y: viewYear, m: viewMonth, d: day };
    renderCalendar();
    var key = eventKey(viewYear, viewMonth, day);
    var ev = EVENTS[key];
    if (ev) {
      updateDock(function () {
        fillEventContent(ev);
      }, false);
    } else {
      updateDock(fillNothingContent, false);
    }
  }

  function renderCalendar() {
    if (!calendarInitialized) return;
    label.textContent = monthNames[viewMonth] + " " + viewYear;
    mount.innerHTML = "";
    weekdays.forEach(function (w) {
      var h = document.createElement("div");
      h.className = "calendar-dow";
      h.setAttribute("role", "columnheader");
      h.textContent = w;
      mount.appendChild(h);
    });
    var padCount = weekdayOfFirst(viewYear, viewMonth);
    for (var i = 0; i < padCount; i++) {
      var pcell = document.createElement("div");
      pcell.className = "calendar-pad";
      pcell.setAttribute("aria-hidden", "true");
      mount.appendChild(pcell);
    }
    var dim = daysInMonth(viewYear, viewMonth);
    for (var day = 1; day <= dim; day++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-cell calendar-day-btn";
      btn.setAttribute("data-cal-day", String(day));
      btn.setAttribute(
        "aria-label",
        monthNames[viewMonth] + " " + day + ", " + viewYear
      );
      var ev = EVENTS[eventKey(viewYear, viewMonth, day)];
      if (ev) btn.classList.add("calendar-cell--event");
      if (dateSelected(viewYear, viewMonth, day)) {
        btn.classList.add("calendar-cell--selected");
      }
      var num = document.createElement("span");
      num.className = "calendar-cell-num";
      num.textContent = String(day);
      btn.appendChild(num);
      if (ev) {
        var mk = document.createElement("span");
        mk.className = "calendar-marker";
        mk.textContent = ev.marker;
        btn.appendChild(mk);
      }
      mount.appendChild(btn);
    }
  }

  if (calendarInitialized && mount) {
    mount.addEventListener("click", function (e) {
      var tgt = e.target.closest(".calendar-day-btn");
      if (!tgt || !mount.contains(tgt)) return;
      var dv = tgt.getAttribute("data-cal-day");
      if (!dv) return;
      onPickDay(parseInt(dv, 10));
    });

    btnPrev.addEventListener("click", function () {
      shiftMonth(-1);
    });
    btnNext.addEventListener("click", function () {
      shiftMonth(1);
    });

    var tx0 = 0;
    var ty0 = 0;
    viewport.addEventListener(
      "touchstart",
      function (e) {
        if (isCompact()) return;
        if (e.changedTouches.length !== 1) return;
        tx0 = e.changedTouches[0].clientX;
        ty0 = e.changedTouches[0].clientY;
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchend",
      function (e) {
        if (isCompact()) return;
        if (e.changedTouches.length !== 1) return;
        var dx = e.changedTouches[0].clientX - tx0;
        var dy = e.changedTouches[0].clientY - ty0;
        if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) shiftMonth(1);
        else shiftMonth(-1);
      },
      { passive: true }
    );
  }

  function shiftMonth(delta) {
    if (isCompact() || !calendarInitialized) return;
    viewMonth += delta;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    } else if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    }
    selected = null;
    renderCalendar();
    updateDock(fillIdleContent, false);
  }

  function raiseDockIfNeeded() {
    if (isCompact()) return;
    if (!reduceMotion) {
      dock.classList.remove("updates-dock--raised");
      void dock.offsetWidth;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          dock.classList.add("updates-dock--raised");
        });
      });
    } else {
      dock.classList.add("updates-dock--raised");
    }
  }

  renderEventsSwipe();

  if (!isCompact()) {
    fillIdleContent();
    renderCalendar();
    raiseDockIfNeeded();
  }

  mqCompact.addEventListener("change", function () {
    renderEventsSwipe();
    if (!isCompact()) {
      fillIdleContent();
      renderCalendar();
      raiseDockIfNeeded();
    } else {
      selected = null;
      if (calendarInitialized) renderCalendar();
      clearSurface();
    }
  });
})();
