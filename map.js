function buildMap(data) {
    // Define the dimensions of the SVG
    const width = 975;
    const height = 610;

    // Create a zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    // Create the SVG element
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .style("max-width", "100%")
        .style("height", "auto")
        .on("click", reset)
        .call(zoom);

    // Append a group for the map
    const mapGroup = svg.append("g")
        .classed("map", true);

    // Append a group for all states
    const allStatesGroup = mapGroup.append("g")
        .classed("all_states", true);

    // Append a group for all counties
    const allCountiesGroup = mapGroup.append("g")
        .classed("all_counties", true);

    // Append states to the allStatesGroup
    const states = allStatesGroup.selectAll("g.state")
        .data(data.states)
        .enter().append("g")
        .attr("id", d => `_${d.FIPS}`)
        .attr("class", d => `state_${d.my_state_fips_code}`)
        .classed("state", true);

    states.append("path")
        .classed("state_boundary", true)
        .attr("d", d => pathGenerator(d.geometry));

    // Append counties to the allCountiesGroup
    const counties = allCountiesGroup.selectAll("g.county")
        .data(data.counties)
        .enter().append("g")
        .attr("id", d => `_${1000 * d.stateFIPS + d.FIPS}`)
        .attr("class", d => `state_${d.my_state_fips_code}`)
        .classed("county", true);

    counties.append("path")
        .classed("county_boundary", true)
        .attr("d", d => pathGenerator(d.geometry));

    // Function to reset the zoom
    function reset() {
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
        );
    }

    // Function to handle zooming
    function zoomed(event) {
        mapGroup.attr("transform", event.transform);
    }

    return svg.node();
}
