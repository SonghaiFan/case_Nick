import UnitchartGridLayoutId from "./js/UnitchartGridLayoutId.js";
import UnitchartGridLayoutKey from "./js/UnitchartGridLayoutKey.js";
import BarChartVerticalMorph from "./js/BarChartVerticalMorph.js";
import BarChartVertical from "./js/BarChartVertical.js";
import BarChartHorizontal from "./js/BarChartHorizontal.js";
import UnitChartForceLayout from "./js/UnitChartForceLayout.js";
import BarChartHorizontalStacked from "./js/BarChartHorizontalStacked.js";
import BarChartHorizontalStackedNormal from "./js/BarChartHorizontalStackedNormal.js";
import StreamChartStep from "./js/StreamChartStep.js";
import StreamChartCurve from "./js/StreamChartCurve.js";
import StreamChartCurveStackOffsetSilhouette from "./js/StreamChartCurveStackOffsetSilhouette.js";
import UnitChartForceSplit from "./js/UnitChartForceSplit.js";
import SankeyChart from "./js/SankeyChart.js";
import UnitchartGridLayout from "./js/UnitchartGridLayoutId.js";

const figures = d3.selectAll("figure");
const steps = d3.selectAll(".step");
const navbar = d3.select("#navbar");
const scroller = scrollama();
const simulation = d3.forceSimulation();
const figure1 = d3.select("#figure1");
const figure2 = d3.select("#figure2");
const canvas1 = figure1.append("svg");
const canvas2 = figure2.append("svg");

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

function handleResize() {
  const stepH = Math.floor(window.innerHeight * 0.75);
  steps.style("height", stepH + "px");

  const figureHeight = window.innerHeight;
  const figureMarginTop = (window.innerHeight - figureHeight) / 2;

  figures
    .style("height", figureHeight + "px")
    .style("top", figureMarginTop + "px");

  scroller.resize();

  const containerRect1 = figure1.node().getBoundingClientRect();
  const containerRect2 = figure2.node().getBoundingClientRect();

  canvas1
    .attr("width", containerRect1.width)
    .attr("height", containerRect1.height);
  canvas2
    .attr("width", containerRect2.width)
    .attr("height", containerRect2.height);
}

// scrollama event handlers
function handleStepChange({ element, direction, index }) {
  const currentStepId = element.getAttribute("id");

  // globalStepHistory.push(currentStepId);
  // console.log(globalStepHistory);
  // const previousElementId = globalStepHistory.shift();

  const nexStep = element.nextElementSibling;
  const nextSection = element.parentNode.parentNode.nextElementSibling;

  const preStep = element.previousElementSibling;
  const preSetion = element.parentNode.parentNode.previousElementSibling;
  const preChapterLastStep =
    preSetion.previousElementSibling.firstElementChild.lastElementChild;

  const nextElementId = nexStep
    ? nexStep.getAttribute("id")
    : nextSection.getAttribute("id");

  const previousElementId = preStep
    ? preStep.getAttribute("id")
    : preChapterLastStep
    ? preChapterLastStep.getAttribute("id")
    : "top";

  navbar.select("#next").attr("href", "#" + nextElementId);
  navbar.select("#previous").attr("href", "#" + previousElementId);

  const containerRect1 = figure1.node().getBoundingClientRect(),
    containerWidth1 = containerRect1.width,
    containerHeight1 = containerRect1.height;

  canvas1
    .select("#morphGroup")
    .selectAll("rect")
    .transition()
    .attr("opacity", 0)
    .end()
    .then(canvas1.select("#morphGroup").selectAll("*").remove());

  // console.log(element);
  steps.classed("is-active", (_, i) => i === index);

  switch (index) {
    case 0:
      UnitchartGridLayoutId(
        data_articleIndentity.filter((d) => d.id == 1),
        canvas1,
        simulation
      ).margin({
        top: 100,
        right: containerWidth1 / 3,
        bottom: 100,
        left: containerWidth1 / 3,
      })();
      UnitchartGridLayoutKey(
        data_groupsIssues.filter((d) => d.id == 1),
        canvas1,
        simulation
      ).margin({
        top: 100,
        right: containerWidth1 / 3,
        bottom: 100,
        left: containerWidth1 / 3,
      })();
      break;

    case 1:
      canvas1
        .select("#figure3Group")
        .transition()
        .duration(500)
        .style("opacity", 0);
      canvas1
        .select("#xAxisGroup")
        .transition()
        .duration(500)
        .style("opacity", 0);
      canvas1
        .select("#yAxisGroup")
        .transition()
        .duration(500)
        .style("opacity", 0);

      UnitchartGridLayoutId(data_articleIndentity, canvas1, simulation).margin({
        top: 100,
        right: containerWidth1 / 4,
        bottom: 100,
        left: containerWidth1 / 4,
      })();
      UnitchartGridLayoutKey(data_groupsIssues, canvas1, simulation).margin({
        top: 100,
        right: containerWidth1 / 4,
        bottom: 100,
        left: containerWidth1 / 4,
      })();
      break;

    case 2:
      UnitchartGridLayoutId(data_articleIndentity, canvas1, simulation).margin({
        top: 100,
        right: containerWidth1 / 2,
        bottom: 100,
        left: 100,
      })();
      UnitchartGridLayoutKey(data_groupsIssues, canvas1, simulation).margin({
        top: 100,
        right: containerWidth1 / 2,
        bottom: 100,
        left: 100,
      })();
      BarChartVerticalMorph(data_groupsIssues, canvas1, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: containerWidth1 / 2,
      })();
      break;

    case 3:
      UnitchartGridLayoutId(data_articleIndentity, canvas1, simulation).margin({
        top: 100,
        right: containerWidth1 / 2,
        bottom: 100,
        left: 100,
      })();
      UnitchartGridLayoutKey(data_groupsIssues, canvas1, simulation).margin({
        top: 100,
        right: containerWidth1 / 2,
        bottom: 100,
        left: 100,
      })();
      BarChartVertical(data_groupsIssues, canvas1, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: containerWidth1 / 2,
      })();
      break;

    case 4:
      UnitchartGridLayoutId(
        data_atLeast25articleIdentity,
        canvas1,
        simulation
      ).margin({
        top: 100,
        right: containerWidth1 / 2,
        bottom: 100,
        left: 100,
      })();
      UnitchartGridLayoutKey(
        data_atLeast25groupsIssues,
        canvas1,
        simulation
      ).margin({
        top: 100,
        right: containerWidth1 / 2,
        bottom: 100,
        left: 100,
      })();
      BarChartVertical(data_atLeast25groupsIssues, canvas1, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: containerWidth1 / 2,
      })();
      break;

    case 5:
      BarChartHorizontal(
        data_atLeast25groupsIssues,
        canvas1,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 200,
        left: 100,
      })();

      canvas1.select("#figure2Group").selectAll("*").remove();

      UnitChartForceLayout(
        data_atLeast25articleIdentity.sample(0),
        canvas1,
        simulation
      )();
      break;

    case 6:
      BarChartHorizontalStacked(
        data_atLeast25groupsIssues,
        canvas1,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 200,
        left: 100,
      })();

      canvas1.select("#figure3Group").selectAll("*").remove();
      break;

    case 7:
      BarChartHorizontalStacked(data_atLeast25groupsIssues, canvas1, simulation)
        .margin({
          top: 100,
          right: 100,
          bottom: 100,
          left: 100,
        })
        .groupKey("year_month")();
      break;

    case 8:
      canvas1.select("#figure3Group").selectAll("*").remove();

      BarChartHorizontalStackedNormal(
        data_atLeast25groupsIssues,
        canvas1,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();
      break;

    case 9:
      canvas1
        .select("#figure2Group")
        .transition()
        .duration(750)
        .style("opacity", 0)
        .end()
        .then(canvas1.select("#figure2Group").selectAll("*").remove());

      StreamChartStep(data_atLeast25groupsIssues, canvas1, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();
      break;

    case 10:
      StreamChartCurve(data_atLeast25groupsIssues, canvas1, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();
      break;

    case 11:
      StreamChartCurve(data_atLeast25groupsIssues, canvas1, simulation)
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
      break;

    case 12:
      StreamChartCurveStackOffsetSilhouette(
        data_atLeast25groupsIssues.filter((d) => d.group_or_issue == "group"),
        canvas1,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();
      break;

    case 13:
      simulation.stop();
      UnitchartGridLayoutId(data_articleIndentity, canvas2, simulation)();
      UnitChartForceLayout(
        data_atLeast25articleIdentity,
        canvas2,
        simulation
      )();
      canvas2.select("#anotationGroup").selectAll("*").remove();
      break;

    case 14:
      UnitChartForceSplit(
        data_atLeast25articleIdentity,
        canvas2,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 200,
      })();

      canvas2.select("#linksGroup").selectAll("*").remove();
      canvas2.select("#nodesGroup").selectAll("*").remove();
      break;

    case 15:
      canvas2.select("#anotationGroup").selectAll("*").remove();
      SankeyChart(
        data_atLeast25groupsIssues.filter((d) => d.id == 1),
        canvas2,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: containerWidth1 / 2,
      })();

      UnitChartForceLayout(
        data_atLeast25articleIdentity.filter((d) => d.id == 1),
        canvas2,
        simulation
      )
        .margin({
          top: 200,
          right: containerWidth1 / 2,
          bottom: 100,
          left: 100,
        })
        .size(50)();
      break;

    case 16:
      SankeyChart(
        data_atLeast25groupsIssues.filter((d) => d.id < 3),
        canvas2,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: containerWidth1 / 2,
      })();

      UnitChartForceLayout(
        data_atLeast25articleIdentity.filter((d) => d.id < 3),
        canvas2,
        simulation
      )
        .margin({
          top: 200,
          right: containerWidth1 / 2,
          bottom: 100,
          left: 100,
        })
        .size(50)();
      break;

    case 17:
      SankeyChart(
        data_atLeast25groupsIssues.filter((d) => d.id < 4),
        canvas2,
        simulation
      ).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: containerWidth1 / 2,
      })();

      UnitChartForceLayout(
        data_atLeast25articleIdentity.filter((d) => d.id < 4),
        canvas2,
        simulation
      )
        .margin({
          top: 200,
          right: containerWidth1 / 2,
          bottom: 100,
          left: 100,
        })
        .size(50)();
      break;

    case 18:
      SankeyChart(data_atLeast25groupsIssues, canvas2, simulation).margin({
        top: 100,
        right: 200,
        bottom: 100,
        left: containerWidth1 / 1.95,
      })();
      simulation.stop();

      UnitchartGridLayoutId(
        data_atLeast25articleIdentity,
        canvas2,
        simulation
      ).margin({
        top: 100,
        right: containerWidth1 / 1.95,
        bottom: 100,
        left: 100,
      })();
      break;

    case 19:
      SankeyChart(data_atLeast25groupsIssues, canvas2, simulation).margin({
        top: 100,
        right: 100,
        bottom: 100,
        left: 100,
      })();

      UnitChartForceLayout(
        data_atLeast25articleIdentity.sample(0),
        canvas2,
        simulation
      )();
      break;

    case 20:
      break;
  }
}

const initialRender = () => {
  canvas1.append("g").attr("id", "figure1Group");
  canvas1.append("g").attr("id", "figure2Group");
  canvas1.append("g").attr("id", "figure3Group");
  canvas1.append("g").attr("id", "figure4Group");
  canvas1.append("g").attr("id", "xAxisGroup");
  canvas1.append("g").attr("id", "yAxisGroup");
  canvas1.append("g").attr("id", "morphGroup");
  canvas1.append("g").attr("id", "anotationGroup");
  canvas1.append("g").attr("id", "linksGroup");
  canvas1.append("g").attr("id", "nodesGroup");
  canvas2.append("g").attr("id", "figure1Group");
  canvas2.append("g").attr("id", "figure2Group");
  canvas2.append("g").attr("id", "figure3Group");
  canvas2.append("g").attr("id", "figure4Group");
  canvas2.append("g").attr("id", "xAxisGroup");
  canvas2.append("g").attr("id", "yAxisGroup");
  canvas2.append("g").attr("id", "morphGroup");
  canvas2.append("g").attr("id", "anotationGroup");
  canvas2.append("g").attr("id", "linksGroup");
  canvas2.append("g").attr("id", "nodesGroup");
};

function init() {
  handleResize();
  initialRender();
  scroller
    .setup({
      step: ".step",
      offset: 0.7,
      debug: false,
    })
    .onStepEnter(handleStepChange);
}

window.onload = init();

window.addEventListener("resize", handleResize);
