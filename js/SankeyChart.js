export default function SankeyChart(aqTable, canvas, simulation) {
  // CANVAS SETUP
  let margin = {
    top: 100,
    right: 100,
    bottom: 100,
    left: 1000,
  };

  function chart() {
    const width = canvas.attr("width") - margin.left - margin.right,
      height = canvas.attr("height") - margin.top - margin.bottom;

    const g1 = canvas.select("#figure1Group"),
      g2 = canvas.select("#figure2Group"),
      g3 = canvas.select("#figure3Group"),
      ga = canvas.select("#anotationGroup"),
      gm = canvas.select("#morphGroup"),
      gx = canvas.select("#xAxisGroup"),
      gy = canvas.select("#yAxisGroup"),
      gl = canvas.select("#linksGroup"),
      gn = canvas.select("#nodesGroup");

    const t = canvas.transition().duration(750);
    const ts = canvas.transition().duration(200);

    ga.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(${margin.left},${margin.top})`);
    gl.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(${margin.left},${margin.top})`);
    gn.transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // DATA MANIPULATE

    console.log(aqTable.objects());

    const aqTable_g = aqTable
      .filter((d) => d.group_or_issue == "group")
      .select("id", "key", "value");

    const aqTable_i = aqTable
      .filter((d) => d.group_or_issue == "issue")
      .select("id", "key", "value");

    const aqTable_gi = aqTable_g
      .join(aqTable_i, ["id", "id"])
      .rename({ key_1: "source", key_2: "target", value_1: "value" })
      .select("id", "source", "target", "value");

    const data_links = aqTable_gi.objects();

    console.log(data_links);

    const sankey = d3
      .sankey()
      .nodeId((d) => d.name)
      .nodeSort((n1, n2) => n2.value - n1.value)
      .nodeWidth(20)
      .nodePadding(10)
      .extent([
        [0, 0],
        [width, height],
      ]);

    const nodeByName = new Map();

    for (const link of data_links) {
      if (!nodeByName.has(link.source))
        nodeByName.set(link.source, { name: link.source });
      if (!nodeByName.has(link.target))
        nodeByName.set(link.target, { name: link.target });
    }

    const data_nodes = Array.from(nodeByName.values());

    const graph = { nodes: data_nodes, links: data_links };

    const { nodes, links } = sankey({
      nodes: graph.nodes.map((d) => Object.assign({}, d)),
      links: graph.links.map((d) => Object.assign({}, d)),
    });

    links.forEach((link) => {
      link.path = link.source.name + "_" + link.target.name;
    });

    const linksByPath = new Map();

    for (const link of links) {
      if (!linksByPath.has(link.path)) {
        linksByPath.set(link.path, [link]);
      } else {
        linksByPath.get(link.path).push(link);
      }
    }

    const linksByPathGroupArray = Array.from(linksByPath.entries());
    const linksByPathGroupKeys = Array.from(linksByPath.keys());

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

    const leftNodeList = [
      "firstnations",
      "racialminorities",
      "women",
      "children",
      "youngpeople",
      "unemployedorprecariouslyemployed",
      "peoplewithdisabilitiesorchronichealthconditions",
    ];

    // const rect = g3
    //   .selectAll("rect")
    //   .data(nodes, (d) => (d.name ? d.name : d.key));

    // rect.join(
    //   function (enter) {
    //     const rectEner = enter
    //       .append("rect")
    //       .attr("id", (d) => d.name)
    //       .attr("y", (d) => d.y0)
    //       .attr("fill", (d) => colorScale(d.name))
    //       .attr("height", (d) => d.y1 - d.y0)
    //       .attr("opacity", 1);

    //     const rectEnterTransition = rectEner
    //       .transition()
    //       .duration(750)
    //       .attr("x", (d) => d.x0)
    //       .attr("width", (d) => d.x1 - d.x0);

    //     return rectEnterTransition;
    //   },
    //   function (update) {
    //     const rectUpdateTransition = update
    //       .transition()
    //       .duration(750)
    //       .attr("y", (d) => d.y0)
    //       .attr("height", (d) => d.y1 - d.y0)
    //       .attr("width", (d) => d.x1 - d.x0)
    //       .transition()
    //       .duration(750)
    //       .attr("x", (d) => d.x0)
    //       .attr("fill", (d) => colorScale(d.name))
    //       .style("opacity", 1);

    //     return rectUpdateTransition;
    //   },
    //   function (exit) {
    //     const rectExitTransition = exit
    //       .transition()
    //       .duration(750)
    //       .attr("width", 0)
    //       .filter((d) => d.x0 < width / 2)
    //       .attr("x", (d) => d.x1);

    //     rectExitTransition.end().then(exit.remove());

    //     return rectExitTransition;
    //   }
    // );
    const nodeGroup = gn.selectAll("g").data(nodes, (d) => d.name);

    console.log(nodes);

    nodeGroup.join(
      (enter) =>
        enter
          .append("g")
          .attr("class", (d) =>
            d.x0 < width / 2
              ? `nodeGroup sourceGroup ${d.name}`
              : `nodeGroup targetGroup ${d.name}`
          )
          .call((enter) =>
            enter
              .append("rect")
              .attr("id", (d) => d.name)
              .attr("y", (d) => d.y0)
              .attr("fill", (d) => colorScale(d.name))
              .attr("height", (d) => d.y1 - d.y0)
              .attr("opacity", 1)
          )
          .call((enter) => {
            enter
              .select("rect")
              .transition(t)
              .attr("x", (d) => d.x0)
              .attr("width", (d) => d.x1 - d.x0);
          })
          .call((enter) =>
            enter
              .append("text")
              .attr("opacity", 0)
              .attr("dy", "0.35em")
              .attr("text-anchor", (d) =>
                leftNodeList.includes(d.name) ? "start" : "end"
              )
              .style("fill", "white")
              .attr("x", (d) =>
                leftNodeList.includes(d.name) ? d.x0 + 30 : d.x1 - 30
              )
              .attr("y", (d) => (d.y1 + d.y0) / 2)
              .text((d) => d.name)
          )
          .call((enter) =>
            enter.select("text").transition(t).attr("opacity", 1)
          ),
      (update) =>
        update
          .call((update) =>
            update
              .select("rect")
              .transition(t)
              .attr("x", (d) => d.x0)
              .attr("y", (d) => d.y0)
              .attr("width", (d) => d.x1 - d.x0)
              .attr("height", (d) => d.y1 - d.y0)
              .attr("fill", (d) => colorScale(d.name))
          )
          .call((update) =>
            update
              .select("text")
              .transition(t)
              .attr("opacity", 1)
              .attr("y", (d) => (d.y1 + d.y0) / 2)
              .attr("x", (d) =>
                leftNodeList.includes(d.name) ? d.x0 + 30 : d.x1 - 30
              )
              .attr("text-anchor", (d) =>
                leftNodeList.includes(d.name) ? "start" : "end"
              )
          ),
      (exit) =>
        exit
          .call((exit) =>
            exit
              .select("rect")
              .transition(ts)
              .attr("width", 0)
              .filter((d) => d.x0 < width / 2)
              .attr("x", (d) => d.x1)
          )
          .call((exit) => exit.select("text").transition(ts).attr("opacity", 0))
          .remove()
    );

    const linksGroups = gl
      .selectAll("g")
      .data(linksByPathGroupArray, (d) => d[0])
      .join("g")
      .attr("class", (d) => `linksGroup ${d[0]}`);

    const linkGroup = linksGroups.selectAll("path").data(
      (d) => d[1],
      (d) => d.id
    );

    linkGroup.join(
      (enter) =>
        enter
          .append("path")
          .attr("class", (d) => `linkGroup article${d.id}`)
          .attr("d", d3.sankeyLinkHorizontal())
          .attr("stroke-dasharray", (d, i, n) => n[i].getTotalLength() * 3)
          .attr("stroke-dashoffset", (d, i, n) => n[i].getTotalLength() * 3)
          .call((enter) =>
            enter
              .transition()
              .duration(750)
              .attr("stroke-width", (d) => Math.max(1, d.width))
              .transition()
              .duration(750)
              .delay((d, i) => i * 20)
              .attr("stroke-dashoffset", 0)
          ),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(750)
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-dasharray", (d, i, n) => n[i].getTotalLength() * 3)
            .attr("stroke-width", (d) => Math.max(1, d.width))
            .attr("stroke-dashoffset", 0)
        ),
      (exit) =>
        exit.call((exit) =>
          exit
            .transition()
            .duration(500)
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", 0)
        )
    );

    const link = gl.selectAll("path");

    link
      .on("mouseover", function (e, d) {
        let overedLink = d3.select(this);
        overedLink.attr("stroke-width", (d) => Math.max(5, d.width)).raise();

        let overedRectId = overedLink
          .attr("class")
          .split(" ")[1]
          .replace("article", "rect");

        let overedLinkGroup = d3.select(this.parentNode);
        let overedPath = overedLinkGroup.attr("class").split(" ")[1];

        let articleInPath = linksByPath.get(overedPath);

        g1.selectAll("rect").attr("fill", "black");

        articleInPath.forEach(function (i) {
          let articleRect = g1.select(`#rect${i.id}`);
          articleRect.attr("fill", "gray");
        });

        g1.select(`#${overedRectId}`).attr("fill", "white");
      })
      .on("mouseout", function (e, d) {
        d3.select(this).attr("stroke-width", (d) => Math.max(1, d.width));
        g1.selectAll("rect").attr("fill", "black");
      });

    const node = gn.selectAll("rect");

    node
      .on("mouseover", function (e, d) {
        g1.selectAll("rect").attr("fill", "black");
        let articleInNode = d.sourceLinks.length
          ? d.sourceLinks
          : d.targetLinks;

        articleInNode.forEach(function (i) {
          let articleRect = g1.select(`#rect${i.id}`);
          articleRect.attr("fill", colorScale(d.name));
        });
      })
      .on("mouseout", function (e, d) {
        g1.selectAll("rect").attr("fill", "black");
      });
  }

  chart.margin = function (value) {
    if (!arguments.length) return margin;
    margin = value;
    return chart;
  };

  return chart;
}
