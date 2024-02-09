// https://observablehq.com/@ryshackleton/us-county-basemap@1579
function _1(md){return(
md`# US County Basemaps

Builds a zoomable US map with states and counties with the following svg structure:
  	- svg
    	 - g class=map
        	- g class=all_states
            	- g id=_[FIPS] class=state
                	- path class=state_boundary
            - g class=all_counties
            	- g id=_[1000*stateFIPS + FIPS] class=state_[my state fips code]
                	- path class=county_boundary
See *mapProps* below for how to pass in color and legend functions for choropleth maps.

The *location_id* field in each topojson.feature.propeties refers to the Institute for Health Metrics and Evaluation's location id system, which can be [downloaded here](http://ghdx.healthdata.org/sites/default/files/record-attached-files/IHME_USA_COUNTY_USE_INJ_MORTALITY_1980_2014_CODEBOOK_CSV.zip) as a zip file.
`
)}

function _2(map){return(
map.render()
)}

function* _map(UnitedStatesChoropleth,mapProps){return(
yield new UnitedStatesChoropleth(mapProps)
)}

function _mapProps(){return(
{
  countyFillFunction: (loc) => ('none'), // override to create county fill colors
  stateFillFunction: (loc) => ('none'), // override to create state fill colors
  countyMouseOverFunction: (loc) => { }, // override to handle mouseovers
  countyMouseOutFunction: (loc) => { }, // override to handle mouseovers
  countyMouseMoveFunction: (loc) => { }, // override to handle mouseovers
  countyOnClickFunction: (loc) => { // override to handle click events
    console.log(loc.properties.location_name);
  },
  //colorScale: @d3.scaleLinear, quantile, etc, // color scale for the legend
  //data: @array, // flat array of your data
  //legendTitle: @string, // title for the legend
  //legendWidthScale: @d3.scaleLinear, d3.scaleSqrt, d3.scaleLog, etc
  zoomEnabled: true,
}
)}

async function _defaultProps(d3,cssProps){return(
{
  containerDivId: 'us_map', // for use outside of observable
  layout: {
    topoJSONBaseWidth: 900, // width scaling associated with the topojson
    topoJSONBaseHeight: 600, // width scaling associated with the topojson
  },
  colorScale: d3.scaleLinear(),
  countyMouseOverFunction: (loc) => { }, // override to handle mouseovers
  countyMouseOutFunction: (loc) => { }, // override to handle mouseovers
  countyMouseMoveFunction: (loc) => { }, // override to handle mouseovers
  countyOnClickFunction: (loc) => { },
  css: cssProps,
  usTopology: (await d3.json('https://gist.githubusercontent.com/Ryshackleton/b3c0f0fa229c5d32462c9897becdb5f1/raw/56b86a43f10af5382aaf1c2e30e5a338681a699c/usa-topo-fips.json')),
  zoomEnabled: true,
}
)}

function _cssProps(){return(
{
  svgClass: 'us_map', // for use outside of observable
  groups: {
    map: 'map',
    allStates: 'all_states',
    allCounties: 'all_counties',
    oneState: 'state',
    oneCounty: 'county',
    legend: 'legend',
  },
  stateBoundary: 'state_boundary',
  countyBoundary: 'county_boundary',
}
)}

function _UnitedStatesChoropleth(_,defaultProps,d3,DOM,topojson){return(
class UnitedStatesChoropleth {
  constructor(props) {
    this.props = _.assign({}, defaultProps, props);
    
    this._init();
    this._buildStateBoundaries();
    this._buildCountyBoundaries();
    this._buildMouseOvers();
    this._buildCustomStyling();
    this._buildLegend();
  }
  /** utility method to build state and county boundary paths */
  static _buildPathInGroup({ selection, data, idFunction, groupClassName, pathClassName, path }) {
    return selection
      .data(data, (datum) => (datum.properties.location_id))
      .enter().append('g')
      .attr('id', idFunction)
      .attr('class', groupClassName)
      .append('path')
      .attr('class', pathClassName)
      .attr('d', path);
  }
  /** returns the state FIPS code from any county or state fips */
  static _stateFIPS(fips) {
    return fips < 100 ? fips : Math.floor(fips / 1000)
  }
  
  /** returns state_[state_fips] for both counties and states to enable
  	d3.selectAll( state_ClassName(location) ) */
  stateClassName(geometry) {
    const {
      css,
    } = this.props;
      const statecss = css.groups.oneState;
      const stateFIPS = UnitedStatesChoropleth._stateFIPS(geometry.properties.FIPS);
      return `${statecss}_${stateFIPS}`;
  }
  
  stateOrCountyID(geometry) {
    const {
      css,
    } = this.props;
    return `_${geometry.properties.FIPS}`;
  }
  
  /** sets up basic svg structure */
  _init() {
    const {
      css,
      layout,
      containerDivId,
      zoomEnabled,
    } = this.props;
    const {
      topoJSONBaseWidth: width,
      topoJSONBaseHeight: height,
    } = layout;
    const self = this;
    
    this.path = d3.geoPath(); 
    this.selections = {};
    this.selections.svg = d3.select(DOM.svg(width,height))
      .style("width", "100%")
      .style("height", "auto");
    
    if(zoomEnabled) {
      this.selections.svg
        .call(
        d3.zoom()
        .scaleExtent([1, 5])
        .on("zoom", () => {
            d3.event.transform.x =
              Math.min(0, Math.max(d3.event.transform.x, width - width * d3.event.transform.k));
            d3.event.transform.y =
              Math.min(0, Math.max(d3.event.transform.y, height - height * d3.event.transform.k));
            self.selections.mapGroup.attr("transform", d3.event.transform);
          })
      );
    }
/*    
    // to use outside of observable 
    this.selections.svg = d3.select(`#${containerDivId}`)
      .append('svg')
      .classed(css.svgClass, true)
      .attr('width', layout.topoJSONBaseWidth)
      .attr('height', layout.topoJSONBaseHeight);
*/
    this.selections.mapGroup = this.selections.svg
      .append('g')
      .classed(css.groups.map, true);
    this.selections.countyGroup = this.selections.mapGroup
      .append('g')
      .classed(css.groups.allCounties, true);
    this.selections.stateGroup = this.selections.mapGroup
      .append('g')
      .classed(css.groups.allStates, true);
   	this.selections.legendGroup = this.selections.svg
      .append('g')
      .classed(css.groups.legend, true);
  }
  
  _buildCustomStyling() {
    const { countyFillFunction, stateFillFunction } = this.props;
    if (countyFillFunction) {
      this.selections.countyBoundaries
      	.attr('fill', countyFillFunction);
    }
    if (stateFillFunction) {
      this.selections.stateBoundaries
      	.attr('fill', stateFillFunction);
    }
  }
  
  _buildCountyBoundaries() {
    const {
      css,
      usTopology,
    } = this.props;
    
    this.selections.countyBoundaries = UnitedStatesChoropleth._buildPathInGroup(
      {
        selection: this.selections.countyGroup.selectAll('g'),
        data: topojson.feature(usTopology, usTopology.objects.counties).features,
        idFunction: this.stateOrCountyID.bind(this),
        groupClassName: this.stateClassName.bind(this),
        pathClassName: css.countyBoundary,
        path: this.path,
      });
  }

function clicked(event, d) {
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    event.stopPropagation();
    states.transition().style("fill", null);
    d3.select(this).transition().style("fill", "red");
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      d3.pointer(event, svg.node())
    );
  }

_buildMouseOvers() {
    const {
      css,
      countyMouseOverFunction,
      countyMouseOutFunction,
      countyMouseMoveFunction,
      countyOnClickFunction,
    } = this.props;
    const self = this; // Store reference to `this` for use inside event listeners
    this.selections.countyBoundaries
      .on('mouseover', function(loc) {
        const stateClass = self.stateClassName(loc);
        self.selections.stateGroup.select(`.${stateClass} path`)
          .classed('highlight_border', true);
        self.selections.countyGroup.select(`#${self.stateOrCountyID(loc)} path`)
          .classed('highlight_fill', true);
        countyMouseOverFunction(loc);
        // Show county name when mouse is over the county
        const countyName = loc.location_name;
        // Append text element for county name
        self.selections.svg.append('text')
          .attr('class', 'county-label')
          .attr('x', self.path.centroid(loc)[0])
          .attr('y', self.path.centroid(loc)[1])
          .text(countyName);
      })
      .on('mousemove', countyMouseMoveFunction)
      .on('mouseout', function(loc) {
        const stateClass = self.stateClassName(loc);
        self.selections.stateGroup.select(`.${stateClass} path`)
          .classed('highlight_border', false);
        self.selections.countyGroup.select(`#${self.stateOrCountyID(loc)} path`)
          .classed('highlight_fill', false);
        countyMouseOutFunction(loc);
        // Remove county name when mouse moves out of the county
        self.selections.svg.selectAll('.county-label').remove();
      })
      .on('click', countyOnClickFunction);
}

  
  _buildLegend() {
    const {
      css,
      colorScale,
      data,
      legendTitle,
      legendWidthScale = d3.scaleSqrt(),
    } = this.props;
    const {
      legendGroup,
    } = this.selections;
    if (!data || !colorScale || !legendTitle)
      return;
    
    const dataExtent = d3.extent(data);
    const x = legendWidthScale
      .domain(dataExtent)
      .rangeRound([450, 800]);
    
    legendGroup
      .attr("transform", "translate(0,20)")
      .selectAll("rect")
    .data(colorScale.range().map(d => {
        d = colorScale.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
    .enter().append("rect")
      .attr("height", 8)
      .attr("x", d => x(d[0]))
      .attr("width", d => (x(d[1]) - x(d[0])))
      .attr("fill", d => colorScale(d[0]));

  legendGroup.append("text")
      .attr("class", "caption")
      .attr("x", x.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(legendTitle);

  legendGroup.call(d3.axisBottom(x)
      .tickSize(13)
      .tickFormat(d3.format(".1f"))
      .tickValues(colorScale.domain()))
    .select(".domain")
      .remove();
  }

  /** takes new properties, merges them with the existing properties, then returns the svg node
   * update this function with other methods to re-render with new props */
  render(newParams) {
    this.props = _.assign({}, this.props, newParams);
    return this.selections.svg.node();
  }
}
)}

function _stateFIPS_Name(_,map){return(
_.keyBy(map.selections.stateBoundaries.nodes().map((node) => (node.__data__.properties)), 'FIPS')
)}

function _usaTreeStructure(map,UnitedStatesChoropleth,_,stateFIPS_Name){return(
map.selections.countyBoundaries.nodes().map((node) => (node.__data__.properties))
  // build the tree structure down to the county level
  .reduce((root, node) => {
  const stateFIPS = UnitedStatesChoropleth._stateFIPS(node.FIPS);
  // define state level
  if(!root.children[stateFIPS]) {
    root.children[stateFIPS] = {
      name: _.get(stateFIPS_Name, [stateFIPS, 'location_name']),
      FIPS: stateFIPS,
      parentFIPS: 0,
      children: {},
    }
  }
  // county level
  root.children[stateFIPS].children[node.FIPS] = {
    name: node.location_name,
    FIPS: node.FIPS,
    parentFIPS: stateFIPS,
  };
  return root;
}, { name: 'USA', FIPS: 0, children: {} })
)}

function _stylesheet(html){return(
html`<style>
/*
svg.us_map {
   width: 100%;
   height: auto;
}
*/
path {
	stroke-linejoin: round;
}

path.state_boundary {
  stroke: gray;
  stroke-opacity: 1;
  stroke-width: 1px;
  pointer-events: none;
}

path.county_boundary {
  stroke: lightgray;
  stroke-opacity: 1;
  stroke-width: 0.25px;
  pointer-events: fill;
}

path.highlight_border {
	stroke-width: 2px;
}

path.highlight_fill {
	fill-opacity: 0.5;
	fill: lightgray;
}

</style>`
)}

function _topojson(require){return(
require("topojson-client@3")
)}

function _d3(require){return(
require("https://d3js.org/d3.v5.min.js")
)}

function __(require){return(
require('lodash')
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["map"], _2);
  main.variable(observer("map")).define("map", ["UnitedStatesChoropleth","mapProps"], _map);
  main.variable(observer("mapProps")).define("mapProps", _mapProps);
  main.variable(observer("defaultProps")).define("defaultProps", ["d3","cssProps"], _defaultProps);
  main.variable(observer("cssProps")).define("cssProps", _cssProps);
  main.variable(observer("UnitedStatesChoropleth")).define("UnitedStatesChoropleth", ["_","defaultProps","d3","DOM","topojson"], _UnitedStatesChoropleth);
  main.variable(observer("stateFIPS_Name")).define("stateFIPS_Name", ["_","map"], _stateFIPS_Name);
  main.variable(observer("usaTreeStructure")).define("usaTreeStructure", ["map","UnitedStatesChoropleth","_","stateFIPS_Name"], _usaTreeStructure);
  main.variable(observer("stylesheet")).define("stylesheet", ["html"], _stylesheet);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("_")).define("_", ["require"], __);
  return main;
}
