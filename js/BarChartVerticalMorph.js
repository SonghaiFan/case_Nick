export default function BarChartVertical(aqTable, canvas, simulation) {
  simulation.stop();
  // CANVAS SETUP
  let margin = {
    top: 100,
    right: 200,
    bottom: 100,
    left: 200,
  };

  function chart() {
    const width = canvas.attr("width") - margin.left - margin.right,
      height = canvas.attr("height") - margin.top - margin.bottom;

    const g1 = canvas.select("#figure1Group"),
      g2 = canvas.select("#figure2Group"),
      g3 = canvas.select("#figure3Group"),
      gm = canvas.select("#morphGroup"),
      gx = canvas.select("#xAxisGroup"),
      gy = canvas.select("#yAxisGroup");

    gm.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(100,100)`);

    g3.transition()
      .duration(750)
      .style("opacity", 0.2)
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const groupKey = "key3";

    const data = aqTable
      .groupby(groupKey)
      .rollup({ value_sum: (d) => op.sum(d.value) })
      .orderby("value_sum")
      .objects();

    const data2 = aqTable
      .groupby(groupKey)
      .derive({ value_stackmax: aq.rolling((d) => op.sum(d.value)) })
      .derive({ value_stackmin: (d) => op.lag(d.value_stackmax, 1, 0) })
      .orderby("id")
      .objects({ grouped: "entries" });
    // .sort((a, b) => a[1].at(-1).value_stackmax - b[1].at(-1).value_stackmax);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value_sum)])
      .range([0, width])
      .nice();

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d[groupKey]))
      .range([height, 0])
      .padding(0.2);

    gx.transition()
      .duration(750)
      .style("opacity", 1)
      .call(d3.axisBottom(xScale))
      .attr("transform", `translate(${margin.left},${margin.top + height})`);

    gy.transition()
      .duration(750)
      .style("opacity", 1)
      .call(d3.axisLeft(yScale))
      .call(function (g) {
        g.selectAll("line").remove();
        g.selectAll("text").style("text-anchor", "start").attr("x", 6);
        return g;
      })
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const keyArray = Array.from(new Set(data.map((d) => d[groupKey])));

    const colorScale = d3
      .scaleOrdinal()
      .domain([
        "firstnations",
        "racialminorities",
        "women",
        "children",
        "youngpeople",
        "unemployedorprecariouslyemployed",
        "peoplewithdisabilitiesorchronichealthconditions",
        "shelter",
        "healthcare_health",
        "familyrelations",
        "violence",
        "voice",
        "work",
        "crime_criminaljustice",
        "inequality",
        "prejudiceanddiscrimination_general",
      ])
      .range(d3.range(1, 17).map((v) => d3.interpolateTurbo(v / 16)));

    console.log(data);

    const rect = g3
      .selectAll("rect")
      .data(data, (d) => (d.name ? d.name : d[groupKey]));

    let promiseQueue = [];

    rect.join(
      function (enter) {
        const rectEnter = enter
          .append("rect")
          .attr("id", (d) => d[groupKey])
          .attr("fill", (d) => colorScale(d[groupKey]))
          .attr("x", (d) => xScale(0))
          .attr("y", (d) => yScale(d[groupKey]))
          .attr("height", yScale.bandwidth());

        const rectEnterTransition = rectEnter
          .transition()
          .duration(750)
          .attr("width", (d) => xScale(d.value_sum) - xScale(0));

        promiseQueue.push(rectEnterTransition.end());

        return rectEnterTransition;
      },
      function (update) {
        const rectUpdateTransition = update
          .transition()
          .duration(750)
          .attr("fill", (d) => colorScale(d[groupKey]))
          .attr("y", (d) => yScale(d[groupKey]))
          .attr("height", yScale.bandwidth())
          .transition()
          .duration(750)
          .attr("x", (d) => xScale(0))
          .attr("width", (d) => xScale(d.value_sum) - xScale(0));
        promiseQueue.push(rectUpdateTransition.end());

        return rectUpdateTransition;
      },
      function (exit) {
        const rectExitTransition = exit
          .transition()
          .duration(750)
          .attr("height", 0)
          .attr("y", height);

        promiseQueue.push(rectExitTransition.end());
        rectExitTransition.end().then(exit.remove());
        return rectExitTransition;
      }
    );

    function morphRect() {
      g2.selectAll(".morphRectGroups").select(function () {
        const newNode = document.getElementById("morphGroup");
        return newNode.appendChild(this.cloneNode(true));
      });

      gm.transition().duration(750).style("opacity", 1);
      gy.raise();

      const morphRectClonedGroups = gm
        .selectAll("g")
        .data(data2, (d) => d[0])
        .join("g")
        .attr("class", (d) => `morphRectClonedGroups ${d[0]}`);

      const morphClonedRectGroup = morphRectClonedGroups
        .selectAll("rect")
        .data((d) => d[1]);

      morphClonedRectGroup.join(
        function (enter) {
          return enter;
        },
        function (update) {
          const rectUpdateTransition = update
            .transition()
            .duration(750)
            // .ease(d3.easeExpIn)
            // .delay(
            //   (d, i) =>
            //     (keyArray.length - keyArray.indexOf(d[groupKey])) * 750 + i * 10
            // )
            .delay((d, i) => d.id * 100 + i * 10)
            .attr("y", (d) => yScale(d[groupKey]))
            .attr("x", (d) => xScale(d.value_stackmin) + margin.left - 100)
            .attr("height", yScale.bandwidth())
            .attr(
              "width",
              (d) => xScale(d.value_stackmax) - xScale(d.value_stackmin)
            );

          return rectUpdateTransition;
        },
        function (exit) {
          const rectExitTransition = exit.transition().style("opacity", 0);
          exit.remove();
          return rectExitTransition;
        }
      );
    }

    Promise.all(promiseQueue).then(morphRect);
  }

  chart.margin = function (value) {
    if (!arguments.length) return margin;
    margin = value;
    return chart;
  };

  return chart;
}
