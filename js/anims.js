jQuery(document).ready(function($) {

  var $doc = $(document),
      $logo = $(".rflow-logo"),
      $anim = $(".rflow-page-anim"),
      $home = $(".home-page-content");
      
  function drawLogo (el) {
    var canvas = new compass.AnimationCanvas(el, { w: 1, h: 1 }, 0.05),
        anim = new compass.AnimationSequence(0);

    var circles = canvas.createLayer("circles");

    var r = canvas.width / 4,
        center = compass.point(r*2, r*2),
        sides = 14,
        angles = d3.range(sides).map(function (i) {
          return compass.τ * i/sides
        })

    anim.addStep("draw circle", { onto: circles, at: center, r: r*0.4, dir: "cw", style: "line-b" }, 300);  

    angles.forEach(function (a) {
      var p1 = compass.point.fromPolar(r*1.2, a, center);

      anim.addStep("draw circle", { onto: circles, at: p1, r: r*0.8, dir: "cw", style: "line-a" }, 30)
    })

    anim.addStep("draw circle", { onto: circles, at: center, r: r*2.0, dir: "cw", style: "line-b" }, 600);

    anim.play();
  }

  function spanimate (el, width, height) {
    var container = d3.select(el),
        discCount = 10,
        maxSize = Math.min(width, height) / 2;

    d3.range(discCount).forEach(function (i) {
      var size = (discCount - i) / discCount * maxSize,
          xPos = Math.round(Math.random() * width),
          yPos = Math.round(Math.random() * height);

      var disc = container.append("div");

      disc
        .attr("class", "rflow-logo")
        .style("width", size + "px") 
        .style("height", size + "px")
        .style("left", xPos + "px")
        .style("top", yPos + "px");

      drawLogo(disc.node());
    })
  }

  function distance (a, b) {
    return Math.sqrt(Math.pow(Math.abs(a.x - b.x),2) + Math.pow(Math.abs(a.y - b.y),2));
  }

  function animate (canvas) {
    var context = canvas.getContext("2d"),
        width = canvas.width,
        height = canvas.height,
        minDistance = 40,
        maxDistance = 60;

    var fills = ["#d7d7d7", "#e2e2e2", "#eee"],
        currentFill = 0;

    var tau = 2 * Math.PI,
        n = Math.min(width, height) >> 1,
        particles = new Array(n),
        mouse = { x:0, y:0 };

    console.log(n, "particles")

    document.addEventListener("mousemove", function(e){
      mouse.x = Math.min(width, Math.max(0, e.x));
      mouse.y = Math.min(height, Math.max(0, e.y));
    })

    for (var i = 0; i < n; ++i) {
      particles[i] = {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 15,
        fill: fills[currentFill = ++currentFill % fills.length],
        vx: 0,
        vy: 0
      };
    }

    function render(elapsed) {
      context.save();
      context.clearRect(0, 0, width, height);

      for (var i = 0; i < n; ++i) {
        var p = particles[i];
        
        p.x += p.vx; if (p.x < -maxDistance) p.x += width + maxDistance * 2; else if (p.x > width + maxDistance) p.x -= width + maxDistance * 2;
        p.y -= p.vy; if (p.y < -maxDistance) p.y += height + maxDistance * 2; else if (p.y > height + maxDistance) p.y -= height + maxDistance * 2;
        
        p.vx += 0.2 * (Math.random() - .5) - 0.01 * p.vx;
        p.vy += 0.05 * (Math.random()) - 0.01 * p.vy;
        
        var distanceFromMouse = distance(p, mouse),
            proximityFactor = 0.5 + (1 - (Math.min(distanceFromMouse, maxDistance) / maxDistance));

        context.beginPath();
        context.fillStyle = p.fill;
        context.arc(p.x, p.y, p.r * proximityFactor, 0, tau);
        context.fill();
      }

      context.restore();
    }

    d3.timer(render);
  }

  drawLogo($logo[0]);

  setTimeout(function () {
    var containerWidth = $doc.width(),
        containerHeight = $doc.height();

    $anim.attr("width", containerWidth + "px");
    $anim.attr("height", containerHeight + "px");
    
    // animate($anim[0], containerWidth, containerHeight);
    animate(document.querySelector(".rflow-page-anim"));
  }, 1000);

})