(function () {
  "use strict";
  var C = window.COUNTRIES;
  var app = document.getElementById("app");

  function fmt(n) { return n.toLocaleString("en-US"); }
  function byName(name) {
    for (var i = 0; i < C.length; i++) if (C[i].name === name) return C[i];
    return null;
  }
  function totalPop() { return C.reduce(function (s, c) { return s + c.pop; }, 0); }
  function avg(key) { return C.reduce(function (s, c) { return s + c[key]; }, 0) / C.length; }

  var METRICS = [
    { key: "pop", label: "Population (millions)", format: function (v) { return fmt(v) + " M"; } },
    { key: "gdp", label: "GDP per capita (USD)", format: function (v) { return "$" + fmt(v); } },
    { key: "life", label: "Life expectancy (years)", format: function (v) { return v.toFixed(1) + " yrs"; } },
    { key: "urban", label: "Urban share (%)", format: function (v) { return v + "%"; } }
  ];

  function bars(metricKey) {
    var m = METRICS.filter(function (x) { return x.key === metricKey; })[0];
    var sorted = C.slice().sort(function (a, b) { return b[metricKey] - a[metricKey]; });
    var max = sorted[0][metricKey];
    return sorted.map(function (c, i) {
      var pct = Math.max(2, Math.round(c[metricKey] / max * 100));
      return '<div class="bar-row"><span class="name">' + c.name + '</span>' +
        '<span class="bar-track"><span class="bar-fill' + (i === 0 ? " amber" : "") + '" style="display:block;width:' + pct + '%"></span></span>' +
        '<span class="val">' + m.format(c[metricKey]) + "</span></div>";
    }).join("");
  }

  function trendPoints(c) {
    // Reconstruct a 2015-2024 population path from the 2024 figure and growth rate.
    var pts = [];
    var p = c.pop;
    for (var y = 2024; y >= 2015; y--) { pts.unshift(p); p = p / (1 + c.growth / 100); }
    return pts;
  }

  function sparkline(c) {
    var pts = trendPoints(c);
    var min = Math.min.apply(null, pts), max = Math.max.apply(null, pts);
    var w = 520, h = 140, pad = 12;
    var step = (w - pad * 2) / (pts.length - 1);
    var coords = pts.map(function (p, i) {
      var x = pad + i * step;
      var y = h - pad - (p - min) / (max - min || 1) * (h - pad * 2);
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    return '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Population trend">' +
      '<polyline points="' + coords + '" fill="none" stroke="#14707a" stroke-width="3"/>' +
      '<text x="' + pad + '" y="' + (h - 2) + '" font-size="11" fill="#5b6b7a">2015</text>' +
      '<text x="' + (w - pad - 28) + '" y="' + (h - 2) + '" font-size="11" fill="#5b6b7a">2024</text></svg>';
  }

  function countryCard(c) {
    return '<article class="country-card"><h3><a href="#/country/' + encodeURIComponent(c.name) + '">' + c.name + "</a></h3>" +
      '<p class="meta">' + c.region + " · Capital " + c.capital + "</p><dl>" +
      "<dt>Population</dt><dd>" + fmt(c.pop) + " M</dd>" +
      "<dt>GDP / person</dt><dd>$" + fmt(c.gdp) + "</dd>" +
      "<dt>Life expectancy</dt><dd>" + c.life.toFixed(1) + " yrs</dd>" +
      "<dt>Urban share</dt><dd>" + c.urban + "%</dd></dl></article>";
  }

  function viewHome() {
    var biggest = C.slice().sort(function (a, b) { return b.pop - a.pop; })[0];
    var richest = C.slice().sort(function (a, b) { return b.gdp - a.gdp; })[0];
    var longest = C.slice().sort(function (a, b) { return b.life - a.life; })[0];
    var tabs = METRICS.map(function (m, i) {
      return '<button data-metric="' + m.key + '"' + (i === 0 ? ' class="active"' : "") + ">" + m.label + "</button>";
    }).join("");
    app.innerHTML =
      '<section class="hero"><h1>The world in numbers</h1>' +
      "<p>Twelve countries, four headline measures. Pick a measure to rank them, open a country for its full profile, or put two side by side.</p></section>" +
      '<section class="stats-row">' +
      '<div class="stat-card"><div class="num">' + fmt(totalPop()) + ' M</div><div class="label">People across the twelve countries</div></div>' +
      '<div class="stat-card"><div class="num">' + biggest.name + '</div><div class="label">Largest population, ' + fmt(biggest.pop) + " million</div></div>" +
      '<div class="stat-card"><div class="num">' + richest.name + '</div><div class="label">Highest GDP per person, $' + fmt(richest.gdp) + "</div></div>" +
      '<div class="stat-card"><div class="num">' + longest.name + '</div><div class="label">Longest lives, ' + longest.life.toFixed(1) + " years on average</div></div>" +
      "</section>" +
      '<section class="panel"><h2>Rankings</h2><p class="sub">Every bar is drawn from the same 2024 estimates. Switch the measure to re-rank.</p>' +
      '<div class="tabs" id="metric-tabs">' + tabs + '</div><div id="chart">' + bars("pop") + "</div></section>" +
      '<section class="panel"><h2>Countries</h2><p class="sub">Average life expectancy across the twelve: ' + avg("life").toFixed(1) + ' years. Open any card for the full profile.</p>' +
      '<div class="grid">' + C.map(countryCard).join("") + "</div></section>";
    document.getElementById("metric-tabs").addEventListener("click", function (e) {
      var key = e.target.getAttribute("data-metric");
      if (!key) return;
      var btns = this.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("active", btns[i].getAttribute("data-metric") === key);
      document.getElementById("chart").innerHTML = bars(key);
    });
  }

  var sortState = { key: "pop", dir: -1 };
  function viewTable() {
    var regions = ["All regions"].concat(C.map(function (c) { return c.region; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    app.innerHTML =
      '<section class="hero"><h1>All countries</h1><p>Search, filter by region, and click a column heading to sort.</p></section>' +
      '<section class="panel"><div class="controls">' +
      '<input id="q" type="search" placeholder="Search a country or capital">' +
      '<select id="region">' + regions.map(function (r) { return '<option value="' + r + '">' + r + "</option>"; }).join("") + "</select></div>" +
      '<div id="table-wrap"></div></section>';
    function render() {
      var q = document.getElementById("q").value.toLowerCase();
      var region = document.getElementById("region").value;
      var rows = C.filter(function (c) {
        return (region === "All regions" || c.region === region) &&
          (c.name.toLowerCase().indexOf(q) !== -1 || c.capital.toLowerCase().indexOf(q) !== -1);
      }).sort(function (a, b) {
        var av = a[sortState.key], bv = b[sortState.key];
        if (typeof av === "string") return av.localeCompare(bv) * sortState.dir;
        return (av - bv) * sortState.dir;
      });
      var head = [["name", "Country"], ["pop", "Population (M)"], ["gdp", "GDP / person"], ["life", "Life expectancy"], ["area", "Area (1000 km2)"], ["urban", "Urban %"]]
        .map(function (h) {
          var arrow = sortState.key === h[0] ? (sortState.dir === 1 ? " ↑" : " ↓") : "";
          return '<th><button data-sort="' + h[0] + '">' + h[1] + arrow + "</button></th>";
        }).join("");
      var body = rows.map(function (c) {
        return '<tr><td><a href="#/country/' + encodeURIComponent(c.name) + '">' + c.name + "</a></td><td>" + fmt(c.pop) + "</td><td>$" + fmt(c.gdp) + "</td><td>" + c.life.toFixed(1) + "</td><td>" + fmt(c.area) + "</td><td>" + c.urban + "%</td></tr>";
      }).join("");
      document.getElementById("table-wrap").innerHTML =
        "<table><thead><tr>" + head + "</tr></thead><tbody>" + (body || '<tr><td colspan="6">No country matches that search.</td></tr>') + "</tbody></table>" +
        '<p class="sub">' + rows.length + " of " + C.length + " countries shown.</p>";
      var btns = document.querySelectorAll("[data-sort]");
      for (var i = 0; i < btns.length; i++) btns[i].addEventListener("click", function () {
        var k = this.getAttribute("data-sort");
        if (sortState.key === k) sortState.dir = -sortState.dir; else { sortState.key = k; sortState.dir = 1; }
        render();
      });
    }
    document.getElementById("q").addEventListener("input", render);
    document.getElementById("region").addEventListener("change", render);
    render();
  }

  function viewCountry(name) {
    var c = byName(name);
    if (!c) { app.innerHTML = '<section class="panel"><h2>Not found</h2><p class="sub">That country is not in the atlas. <a href="#/table">Back to all countries</a></p></section>'; return; }
    var density = Math.round(c.pop * 1000000 / (c.area * 1000));
    var cards = [
      [fmt(c.pop) + " M", "Population (2024)"],
      ["$" + fmt(c.gdp), "GDP per person"],
      [c.life.toFixed(1) + " yrs", "Life expectancy"],
      [fmt(density) + " /km2", "People per square kilometre"],
      [c.urban + "%", "Living in cities"],
      [(c.growth >= 0 ? "+" : "") + c.growth.toFixed(1) + "%", "Population growth per year"]
    ].map(function (x) { return '<div class="stat-card"><div class="num">' + x[0] + '</div><div class="label">' + x[1] + "</div></div>"; }).join("");
    app.innerHTML =
      '<section class="hero"><h1>' + c.name + '</h1><p>' + c.region + " · Capital " + c.capital + " · Language: " + c.lang + " · Land area " + fmt(c.area) + " thousand km2.</p></section>" +
      '<section class="detail-grid">' + cards + "</section>" +
      '<section class="panel"><h2>Population, 2015–2024</h2><p class="sub">Reconstructed from the 2024 figure and the current growth rate of ' + c.growth.toFixed(1) + '% a year.</p>' + sparkline(c) + "</section>" +
      '<section class="panel"><h2>How it compares</h2><p class="sub">Population against the atlas average of ' + fmt(Math.round(avg("pop"))) + ' million.</p>' +
      '<div class="bar-row"><span class="name">' + c.name + '</span><span class="bar-track"><span class="bar-fill amber" style="display:block;width:' + Math.round(c.pop / Math.max(c.pop, avg("pop")) * 100) + '%"></span></span><span class="val">' + fmt(c.pop) + " M</span></div>" +
      '<div class="bar-row"><span class="name">Average</span><span class="bar-track"><span class="bar-fill" style="display:block;width:' + Math.round(avg("pop") / Math.max(c.pop, avg("pop")) * 100) + '%"></span></span><span class="val">' + fmt(Math.round(avg("pop"))) + " M</span></div>" +
      '<p><a href="#/compare">Compare ' + c.name + " with another country</a> · <a href=\"#/table\">All countries</a></p></section>";
  }

  function compareCard(c, other) {
    function row(label, v, ov, format) {
      var win = v > ov ? " — ahead" : (v < ov ? "" : " — level");
      return "<dt>" + label + "</dt><dd>" + format(v) + win + "</dd>";
    }
    return '<article class="country-card"><h3><a href="#/country/' + encodeURIComponent(c.name) + '">' + c.name + "</a></h3>" +
      '<p class="meta">' + c.region + " · " + c.capital + "</p><dl>" +
      row("Population", c.pop, other.pop, function (v) { return fmt(v) + " M"; }) +
      row("GDP / person", c.gdp, other.gdp, function (v) { return "$" + fmt(v); }) +
      row("Life expectancy", c.life, other.life, function (v) { return v.toFixed(1) + " yrs"; }) +
      row("Urban share", c.urban, other.urban, function (v) { return v + "%"; }) +
      row("Land area", c.area, other.area, function (v) { return fmt(v) + "k km2"; }) +
      row("Growth / yr", c.growth, other.growth, function (v) { return v.toFixed(1) + "%"; }) +
      "</dl></article>";
  }

  function viewCompare() {
    var opts = C.map(function (c) { return '<option value="' + c.name + '">' + c.name + "</option>"; }).join("");
    app.innerHTML =
      '<section class="hero"><h1>Compare two countries</h1><p>Pick any pair. The stronger figure in each row is marked “ahead”.</p></section>' +
      '<section class="panel"><div class="controls"><select id="a">' + opts + '</select><select id="b">' + opts + '</select></div><div id="cmp"></div></section>';
    var a = document.getElementById("a"), b = document.getElementById("b");
    a.value = "Japan"; b.value = "Germany";
    function render() {
      var ca = byName(a.value), cb = byName(b.value);
      document.getElementById("cmp").innerHTML =
        '<div class="compare-grid">' + compareCard(ca, cb) + compareCard(cb, ca) + "</div>" +
        '<p class="vs">' + ca.name + " vs " + cb.name + "</p>";
    }
    a.addEventListener("change", render);
    b.addEventListener("change", render);
    render();
  }

  function route() {
    var hash = location.hash || "#/";
    if (hash === "#/" || hash === "#") viewHome();
    else if (hash === "#/table") viewTable();
    else if (hash === "#/compare") viewCompare();
    else if (hash.indexOf("#/country/") === 0) viewCountry(decodeURIComponent(hash.slice(10)));
    else viewHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
