export default function StreamChartStep(aqTable, canvas, simulation) {
  simulation.stop();
  // CANVAS SETUP
  let margin = {
    top: 100,
    right: 200,
    bottom: 100,
    left: 200,
  };

  let groupKey = "year_month";

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
      .attr("opacity", 0)
      .end()
      .then(gm.selectAll("*").remove());

    const data0 = aqTable.objects();
    const keyArray = Array.from(new Set(data0.map((d) => d.key))).sort();

    const dtg = aqTable
      .groupby("year_month")
      .pivot("key", { value: (d) => (op.sum(d.value) ? op.sum(d.value) : 0) })
      .orderby("year_month");

    const dtg1 = aqTable
      .groupby("year_month")
      .pivot("key", { value: (d) => (op.sum(d.value) ? op.sum(d.value) : 0) })
      .orderby("year_month")
      .slice(-1)
      .derive({
        year_month: aq.escape((d) => d3.timeMonth.offset(d.year_month, 1)),
      });

    const data = dtg.concat(dtg1).orderby("year_month").objects();

    const stack = d3.stack().keys(keyArray).offset(d3.stackOffsetExpand);

    const dataStacked = stack(data);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(dataStacked, (d) => d3.min(d, (d) => d[0])),
        d3.max(dataStacked, (d) => d3.max(d, (d) => d[1])),
      ])
      .range([height, 0]);

    const xScale = d3
      .scaleTime()
      .domain([
        d3.min(data.map((d) => d3.timeMonth.offset(d.year_month, -1))),
        d3.max(data.map((d) => d3.timeMonth.offset(d.year_month, 1))),
      ])
      .range([0, width]);

    const xScaleLength = d3.timeMonth.range(...xScale.domain()).length;

    g3.transition()
      .duration(750)
      .style("opacity", 1)
      .attr(
        "transform",
        `translate(${margin.left - width / xScaleLength / 2},${margin.top})`
      );

    const area = d3
      .area()
      .x((d) => xScale(d.data.year_month))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveStepAfter);

    gx.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(${margin.left},${margin.top + height})`)
      .call(d3.axisBottom(xScale));

    gy.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(yScale))
      .call(function (g) {
        g.selectAll("text").style("text-anchor", "start").attr("x", -34);
        return g;
      });

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

    const path = g3.selectAll("path").data(dataStacked, (d) => d.key);

    path.join(
      function (enter) {
        const rectEner = enter
          .append("path")
          .attr("fill", (d) => colorScale(d.key))
          .attr("d", area);

        return rectEner;
      },
      function (update) {
        const rectUpdateTransition = update
          .transition()
          .duration(1000)
          .attrTween("d", function (d) {
            var previous = d3.select(this).attr("d");
            var current = area(d);
            return d3.interpolatePath(previous, current);
          });

        return rectUpdateTransition;
      },
      function (exit) {
        return exit.remove();
      }
    );
  }

  chart.margin = function (value) {
    if (!arguments.length) return margin;
    margin = value;
    return chart;
  };

  return chart;
}
