import UnitchartGridLayoutId from "./js/UnitchartGridLayoutId.js";
import UnitchartGridLayoutKey from "./js/UnitchartGridLayoutKey.js";
import BarChartHorizontal from "./js/BarChartHorizontal.js";
import BarChartHorizontalStacked from "./js/BarChartHorizontalStacked.js";
import BarChartHorizontalStackedNormal from "./js/BarChartHorizontalStackedNormal.js";
import BarChartVertical from "./js/BarChartVertical.js";
import BarChartVerticalMorph from "./js/BarChartVerticalMorph.js";
import StreamChartCurveStackOffsetSilhouette from "./js/StreamChartCurveStackOffsetSilhouette.js";
import SankeyChart from "./js/SankeyChart.js";
import StreamChartStep from "./js/StreamChartStep.js";
import StreamChartCurve from "./js/StreamChartCurve.js";
import UnitChartForceLayout from "./js/UnitChartForceLayout.js";

const main = d3.select("main");
const scrolly = main.select("#scrolly");
const figure = scrolly.select("figure");
const article = scrolly.select("article");
const canvas = figure.append("svg");
const step = article.selectAll(".step");
const scroller = scrollama();
const simulation = d3.forceSimulation();

const aqTable = await aq.loadCSV("./data/data_raw.csv");

function normalizeColumn(name) {
  return name
    .toLowerCase() // map to lower case
    .replace(/[%#$£()\'\"]/g, "") // remove unwanted characters
    .replace(/[ /,+.*:\-\r\n@]/g, "_") // replace spacing and punctuation with an underscore
    .replace(/_+/g, "_") // collapse repeated underscores
    .normalize("NFD") // perform unicode normalization
    .replace(/[\u0300-\u036f]/g, ""); // strip accents from characters
}

function normalize(table) {
  const name = table.columnNames();
  return aq
    .table({ name, norm: name.map(normalizeColumn) }) // create table of names & normalized names
    .groupby("norm") // group by normalized name
    .derive({ index: aq.op.row_number(), count: aq.op.count() }) // count duplicates, generate index for each
    .objects() // generate an array of { name, norm } objects
    .map((o) => ({ [o.name]: o.norm + (o.count > 1 ? `_${o.index}` : "") })); // rename, adding index as needed
}

function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

const aqTable2 = aqTable
  .select(normalize)
  .derive({ id: aq.op.row_number() })
  .relocate(aq.not("id"), { after: "id" })
  .derive({
    publisher: (d) =>
      d.publisher == "Fairfax Media Management Pty Limited"
        ? "Fairfax"
        : d.publisher == "News Ltd."
        ? "News"
        : "Others",
  })
  .derive({
    date: aq.escape((d) =>
      randomDate(new Date(2020, 0, 1), new Date(2021, 11, 30))
    ),
  });

const articleIndentity = ["id", "heading", "publisher", "date"];

const characteristicsScore = [
  "amplifiesdisadvantagedvoice",
  "dispargesdisadvantaged",
  "recognisesintersectionality",
  "provideshumanexamples",
  "focusesonsolutions",
];

const nonFoldColumns = articleIndentity.concat(characteristicsScore);

const groupsIssues = aqTable2.select(aq.not(nonFoldColumns)).columnNames();

const groups = groupsIssues.slice(0, 26);
const issues = groupsIssues.slice(26);

const culturalminorities = groups.slice(0, 4);
const genderandsexuality = groups.slice(4, 7);
const age = groups.slice(7, 10);
const socioeconomicstatus = groups.slice(10, 15);
const healthstatus = groups.slice(15, 19);
const institutionalisation = groups.slice(19, 21);
const othres = groups.slice(21);

const general = issues.slice(28);
const particular = issues.slice(0, 28);

const aqTable3 = aqTable2
  .fold(groupsIssues)
  .groupby("key")
  .rollup({ value_sum: (d) => op.sum(d.value) })
  .orderby(aq.desc("value_sum"));

const atLeast25groupsIssues = aqTable3
  .filter((d) => d.value_sum >= 25)
  .orderby(aq.desc("value_sum"))
  .columnArray("key");

const data_articleIndentity = aqTable2.select(articleIndentity);

const data_atLeast25articleIdentity = aqTable2
  .select(articleIndentity.concat(atLeast25groupsIssues))
  .fold(atLeast25groupsIssues)
  .filter((d) => d.value == 1)
  .groupby(articleIndentity)
  .pivot("key", "value")
  .select(articleIndentity);

const data_characteristicsScore = aqTable2
  .select(["id", "publisher"].concat(characteristicsScore))
  .fold(characteristicsScore);

const data_groupsIssues = aqTable2
  .select(["id", "date"].concat(groupsIssues))
  .fold(groupsIssues)
  .filter((d) => d.value == 1)
  .derive({
    group_or_issue: aq.escape((d) =>
      groups.includes(d.key) ? "group" : "issue"
    ),
    groups_or_issues: aq.escape((d) => {
      if (culturalminorities.includes(d.key)) {
        return "culturalminorities";
      } else if (genderandsexuality.includes(d.key)) {
        return "genderandsexuality";
      } else if (age.includes(d.key)) {
        return "age";
      } else if (socioeconomicstatus.includes(d.key)) {
        return "socioeconomicstatus";
      } else if (healthstatus.includes(d.key)) {
        return "healthstatus";
      } else if (institutionalisation.includes(d.key)) {
        return "institutionalisation";
      } else if (othres.includes(d.key)) {
        return "othres";
      } else if (particular.includes(d.key)) {
        return "particular";
      } else if (general.includes(d.key)) {
        return "general";
      }
    }),
  });

const data_atLeast25groupsIssues = aqTable2
  .select(["id", "date"].concat(atLeast25groupsIssues))
  .fold(atLeast25groupsIssues)
  .filter((d) => d.value == 1)
  .derive({
    year_month: aq.escape(
      (d) => new Date(d.date.getFullYear(), d.date.getMonth())
    ),
  })
  .derive({
    group_or_issue: aq.escape((d) =>
      groups.includes(d.key) ? "group" : "issue"
    ),
    groups_or_issues: aq.escape((d) => {
      if (culturalminorities.includes(d.key)) {
        return "culturalminorities";
      } else if (genderandsexuality.includes(d.key)) {
        return "genderandsexuality";
      } else if (age.includes(d.key)) {
        return "age";
      } else if (socioeconomicstatus.includes(d.key)) {
        return "socioeconomicstatus";
      } else if (healthstatus.includes(d.key)) {
        return "healthstatus";
      } else if (institutionalisation.includes(d.key)) {
        return "institutionalisation";
      } else if (othres.includes(d.key)) {
        return "othres";
      } else if (particular.includes(d.key)) {
        return "particular";
      } else if (general.includes(d.key)) {
        return "general";
      }
    }),
  });

const handleResize = () => {
  const stepHeight = Math.floor(window.innerHeight * 0.75);

  // step.style("height", stepHeight + "px");

  const figureHeight = window.innerHeight;
  const figureMarginTop = (window.innerHeight - figureHeight) / 2;

  figure
    .style("height", figureHeight + "px")
    .style("top", figureMarginTop + "px");

  scroller.resize();

  const containerRect = figure.node().getBoundingClientRect(),
    containerWidth = containerRect.width,
    containerHeight = containerRect.height;

  canvas.attr("width", containerWidth).attr("height", containerHeight);
};

// scrollama event handlers
const handleStepChange = ({ element, direction, index }) => {
  // response = { element, direction, index }

  const containerRect = figure.node().getBoundingClientRect(),
    containerWidth = containerRect.width,
    containerHeight = containerRect.height;

  // add color to current step only
  step.classed("is-active", (_, i) => i === index);
  console.log(element, direction, index);

  canvas
    .select("#morphGroup")
    .selectAll("rect")
    .transition()
    .attr("opacity", 0)
    .end()
    .then(canvas.select("#morphGroup").selectAll("*").remove());

  switch (index) {
    case 0:
      // g1
      UnitchartGridLayoutId(
        data_articleIndentity.filter((d) => d.id == 1),
        canvas,
        simulation
      )();
      // g2
      UnitchartGridLayoutKey(
        data_groupsIssues.filter((d) => d.id == 1),
        canvas,
        simulation
      )();
      break;

    case 1:
      canvas
        .select("#figure3Group")
        .transition()
        .duration(500)
        .style("opacity", 0);
      canvas
        .select("#xAxisGroup")
        .transition()
        .duration(500)
        .style("opacity", 0);
      canvas
        .select("#yAxisGroup")
        .transition()
        .duration(500)
        .style("opacity", 0);

      UnitchartGridLayoutId(
        data_articleIndentity.filter((d) => d.id < 5),
        canvas,
        simulation
      )();
      UnitchartGridLayoutKey(
        data_groupsIssues.filter((d) => d.id < 5),
        canvas,
        simulation
      )();
      break;

    case 2:
      UnitchartGridLayoutId(
        data_articleIndentity.filter((d) => d.id < 50),
        canvas,
        simulation
      ).margin({
        top: 100,
        right: containerWidth / 2,
        bottom: 100,
        left: 100,
      })();
      UnitchartGridLayoutKey(
        data_groupsIssues.filter((d) => d.id < 50),
        canvas,
        simulation
      ).margin({
        top: 100,
        right: containerWidth / 2,
        bottom: 100,
        left: 100,
      })();

      BarChartVerticalMorph(
        data_groupsIssues.filter((d) => d.id < 50),
        canvas,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: containerWidth / 2,
      })();

      break;

    case 3:
      UnitchartGridLayoutId(data_articleIndentity, canvas, simulation).margin({
        top: 100,
        right: containerWidth / 2,
        bottom: 100,
        left: 100,
      })();
      UnitchartGridLayoutKey(data_groupsIssues, canvas, simulation).margin({
        top: 100,
        right: containerWidth / 2,
        bottom: 100,
        left: 100,
      })();

      BarChartVertical(data_groupsIssues, canvas, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: containerWidth / 2,
      })();
      break;

    case 4:
      UnitchartGridLayoutId(
        data_atLeast25articleIdentity,
        canvas,
        simulation
      ).margin({
        top: 100,
        right: containerWidth / 2,
        bottom: 100,
        left: 100,
      })();
      UnitchartGridLayoutKey(
        data_atLeast25groupsIssues,
        canvas,
        simulation
      ).margin({
        top: 100,
        right: containerWidth / 2,
        bottom: 100,
        left: 100,
      })();

      BarChartVertical(data_atLeast25groupsIssues, canvas, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: containerWidth / 2,
      })();
      break;

    case 5:
      BarChartHorizontal(data_atLeast25groupsIssues, canvas, simulation).margin(
        {
          top: 100,
          right: 100,
          bottom: 100,
          left: 100,
        }
      )();
      canvas.select("#figure2Group").selectAll("*").remove();

      UnitChartForceLayout(
        data_atLeast25articleIdentity.sample(0),
        canvas,
        simulation
      )();

      break;

    case 6:
      BarChartHorizontalStacked(
        data_atLeast25groupsIssues,
        canvas,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();

      canvas.select("#figure3Group").selectAll("*").remove();
      break;

    case 7:
      BarChartHorizontalStacked(data_atLeast25groupsIssues, canvas, simulation)
        .margin({
          top: 100,
          right: 100,
          bottom: 100,
          left: 100,
        })
        .groupKey("year_month")();
      break;

    case 8:
      // canvas.select("#figure3Group").selectAll("*").remove();

      BarChartHorizontalStackedNormal(
        data_atLeast25groupsIssues,
        canvas,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();

      // SankeyChart(
      //   data_atLeast25groupsIssues.filter((d) => d.id < 6),
      //   canvas,
      //   simulation
      // ).margin({
      //   top: 100,
      //   right: 100,
      //   bottom: 100,
      //   left: containerWidth / 2,
      // })();

      // UnitChartForceLayout(
      //   data_atLeast25articleIdentity.filter((d) => d.id < 6),
      //   canvas,
      //   simulation
      // ).margin({
      //   top: 200,
      //   right: containerWidth / 2,
      //   bottom: 100,
      //   left: 100,
      // })();
      break;

    case 9:
      canvas
        .select("#figure2Group")
        .transition()
        .duration(750)
        .style("opacity", 0)
        .end()
        .then(canvas.select("#figure2Group").selectAll("*").remove());

      StreamChartStep(data_atLeast25groupsIssues, canvas, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();

      // SankeyChart(
      //   data_atLeast25groupsIssues.filter((d) => d.id < 10),
      //   canvas,
      //   simulation
      // ).margin({
      //   top: 100,
      //   right: 100,
      //   bottom: 100,
      //   left: containerWidth / 2,
      // })();

      // UnitChartForceLayout(
      //   data_atLeast25articleIdentity.filter((d) => d.id < 10),
      //   canvas,
      //   simulation
      // ).margin({
      //   top: 100,
      //   right: containerWidth / 2,
      //   bottom: 100,
      //   left: 100,
      // })();
      break;

    case 10:
      StreamChartCurve(data_atLeast25groupsIssues, canvas, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();
      // simulation.stop();
      // SankeyChart(data_atLeast25groupsIssues, canvas, simulation).margin({
      //   top: 100,
      //   right: 100,
      //   bottom: 100,
      //   left: containerWidth / 2,
      // })();

      // UnitchartGridLayoutId(
      //   data_atLeast25articleIdentity,
      //   canvas,
      //   simulation
      // ).margin({
      //   top: 100,
      //   right: containerWidth / 2,
      //   bottom: 100,
      //   left: 100,
      // })();
      break;

    case 11:
      StreamChartCurve(data_atLeast25groupsIssues, canvas, simulation)
        .margin({
          top: 100,
          right: 100,
          bottom: 100,
          left: 100,
        })
        .DateRange({
          startDate: new Date(2021, 0, 1),
          endDate: new Date(2022, 0, 1),
        })();
      // SankeyChart(data_groupsIssues, canvas, simulation)();

      // UnitchartGridLayoutId(data_articleIndentity, canvas, simulation).margin({
      //   top: 100,
      //   right: 1050,
      //   bottom: 100,
      //   left: 100,
      // })();
      break;

    case 12:
      StreamChartCurveStackOffsetSilhouette(
        data_atLeast25groupsIssues.filter((d) => d.group_or_issue == "group"),
        canvas,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();
      // SankeyChart(data_groupsIssues, canvas, simulation)();

      // UnitchartGridLayoutId(data_articleIndentity, canvas, simulation).margin({
      //   top: 100,
      //   right: 1050,
      //   bottom: 100,
      //   left: 100,
      // })();
      break;
  }
};

const initialRender = () => {
  canvas.append("g").attr("id", "figure1Group");
  canvas.append("g").attr("id", "figure2Group");
  canvas.append("g").attr("id", "figure3Group");
  canvas.append("g").attr("id", "xAxisGroup");
  canvas.append("g").attr("id", "yAxisGroup");
  canvas.append("g").attr("id", "morphGroup");
  canvas.append("g").attr("id", "anotationGroup");
  canvas.append("g").attr("id", "linksGroup");
  canvas.append("g").attr("id", "nodesGroup");
};

const init = () => {
  handleResize();
  initialRender();
  scroller
    .setup({
      step: "#scrolly article .step",
      offset: 0.4,
      debug: false,
    })
    .onStepEnter(handleStepChange);
};

window.onload = init();
