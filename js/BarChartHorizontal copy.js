export default function BarChartHorizontal(aqTable, canvas, simulation) {
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
      .attr("opacity", 0)
      .end()
      .then(gm.selectAll("*").remove());

    g3.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const groupKey = "key3";

    const data = aqTable
      .groupby(["key", "key3"])
      .rollup({ value_sum: (d) => op.sum(d.value) })
      .orderby(["key", aq.desc("value_sum")])
      .objects();

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value_sum)])
      .range([height, 0])
      .nice();

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d[groupKey]))
      .range([0, width])
      .padding(0.2);

    gx.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(${margin.left},${margin.top + height})`)
      .call(d3.axisBottom(xScale))
      .call(function (g) {
        g.selectAll("text")
          .style("text-anchor", "start")
          .attr("transform", "rotate(15)");
        return g;
      });

    gy.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(yScale))
      .call(function (g) {
        g.selectAll("text").style("text-anchor", "start").attr("x", -34);
        return g;
      });

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

    const rect = g3
      .selectAll("rect")
      .data(data, (d) => (d[groupKey] ? d[groupKey] : d.name));

    rect.join(
      (enter) =>
        enter
          .append("rect")
          .attr("fill", (d) => colorScale(d[groupKey]))
          .style("mix-blend-mode", "multiply")
          .attr("y", height)
          .attr("x", (d) => xScale(d[groupKey]))
          .attr("width", xScale.bandwidth())
          .call((enter) =>
            enter
              .transition()
              .duration(750)
              .attr("y", (d) => yScale(d.value_sum))
              .attr("height", (d) => height - yScale(d.value_sum))
          ),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(750)
            .attr("fill", (d) => colorScale(d[groupKey]))
            .attr("width", xScale.bandwidth())
            .attr("x", (d) => xScale(d[groupKey]))
            .transition()
            .duration(750)
            .attr("y", (d) => yScale(d.value_sum))
            .attr("height", (d) => height - yScale(d.value_sum))
        ),
      (exit) =>
        exit.call((exit) =>
          exit
            .transition()
            .duration(750)
            .attr("height", 0)
            .attr("y", height)
            .remove()
        )
    );
  }

  chart.margin = function (value) {
    if (!arguments.length) return margin;
    margin = value;
    return chart;
  };

  return chart;
}
