export default function BarChartHorizontalStacked(aqTable, canvas, simulation) {
  simulation.stop();
  // CANVAS SETUP
  let margin = {
    top: 100,
    right: 200,
    bottom: 100,
    left: 200,
  };

  let groupKey = "key";

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

    g2.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (groupKey == "key") {
      const data = aqTable
        .groupby(["group_or_issue", "key"])
        .derive({ value_sum: (d) => op.sum(d.value) })
        .derive({ value_stackmax: aq.rolling((d) => op.sum(d.value)) })
        .derive({ value_stackmin: (d) => op.lag(d.value_stackmax, 1, 0) })
        .orderby(["group_or_issue", aq.desc("value_sum")])
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

      const rect = g2
        .selectAll("rect")
        .data(data, (d) => [d.id, d.key, d.year_month]);

      rect.join(
        (enter) =>
          enter
            .append("rect")
            .attr("fill", (d) => colorScale(d[groupKey]))
            .style("mix-blend-mode", "multiply")
            .attr("x", (d) => xScale(d[groupKey]))
            .attr("width", xScale.bandwidth())
            .attr("y", (d) => yScale(d.value_stackmax))
            .attr(
              "height",
              (d) => height - yScale(d.value_stackmax - d.value_stackmin)
            ),
        (update) =>
          update.call((update) =>
            update
              .transition()
              .duration(750)
              .delay((d, i) => keyArray.indexOf(d[groupKey]) * 10)
              .attr("fill", (d) => colorScale(d[groupKey]))
              .attr("width", xScale.bandwidth())
              .attr("y", (d) => yScale(d.value_stackmax))
              .transition()
              .duration(750)
              .delay((d, i) => i * 1)
              .attr("x", (d) => xScale(d[groupKey]))
              .attr(
                "height",
                (d) => height - yScale(d.value_stackmax - d.value_stackmin)
              )
          ),
        (exit) =>
          exit.call((exit) =>
            exit
              .transition()
              .duration(750)
              .attr("height", 0)
              .attr("y", (d) => height - yScale(d.value_stackmin))
              .remove()
          )
      );
    }

    if (groupKey == "year_month") {
      const data = aqTable
        .groupby("year_month")
        .orderby("year_month", "key")
        .derive({ value_sum: (d) => op.sum(d.value) })
        .derive({ value_stackmax: aq.rolling((d) => op.sum(d.value)) })
        .derive({ value_stackmin: (d) => op.lag(d.value_stackmax, 1, 0) })
        .objects();

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value_sum)])
        .range([height, 0]);

      const paddedExtent = [
        d3.min(data.map((d) => d3.timeMonth.offset(d.year_month, -1))),
        d3.max(data.map((d) => d3.timeMonth.offset(d.year_month, 1))),
      ];

      const xScale = d3.scaleTime().domain(paddedExtent).range([0, width]);

      const xBand = d3
        .scaleBand()
        .domain(d3.timeMonth.range(...xScale.domain()))
        .range([0, width])
        .padding(0.1);
      // .round(true);

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

      const rect = g2
        .selectAll("rect")
        .data(data, (d) => [d.id, d.key, d.year_month]);

      rect.join(
        (enter) =>
          enter
            .append("rect")
            .attr("fill", (d) => colorScale(d.key))
            .style("mix-blend-mode", "multiply")
            .attr("x", (d) => xBand(d.year_month) - xBand.bandwidth() / 2)
            .attr("y", (d) => yScale(d.value_stackmax))
            .attr(
              "height",
              (d) => height - yScale(d.value_stackmax - d.value_stackmin)
            )
            .attr("width", xBand.bandwidth),
        (update) =>
          update.call((update) =>
            update
              .transition()
              .duration(750)
              .delay((d, i) => keyArray.indexOf(d.year_month) * 1)
              .attr("x", (d) => xBand(d.year_month) - xBand.bandwidth() / 2)
              .attr("width", xBand.bandwidth())
              .transition()
              .duration(500)
              .attr(
                "height",
                (d) => height - yScale(d.value_stackmax - d.value_stackmin)
              )
              .attr("y", (d) => yScale(d.value_stackmax))
          ),
        (exit) =>
          exit.call((exit) =>
            exit
              .transition()
              .duration(750)
              .attr("height", 0)
              .attr("y", (d) => height - yScale(d.value_stackmin))
              .remove()
          )
      );
    }
  }

  chart.margin = function (value) {
    if (!arguments.length) return margin;
    margin = value;
    return chart;
  };

  chart.groupKey = function (value) {
    if (!arguments.length) return groupKey;
    groupKey = value;
    return chart;
  };

  return chart;
}
