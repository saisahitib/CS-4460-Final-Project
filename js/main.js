// selects the svg in the html body
var svg = d3.select("#svg");

// storing the dimensions and margins
var width = 1000;
var height = 500;
var margin = {top: 20, right: 190, bottom: 0, left: 40}

// D3 v4 loading syntax
d3.csv("./data/election.csv", function(data){

	// filters the data to only include election data from the year 2000
	var year_data = data.filter(function(d) {
		return d.year == 2000
	})

	var pie;
	var graph;
	var color;
	var partiesByState;
	var graphData;
	var parties;
	var x;
	var y;

	// creates stacked bar chart
	function createGraph() {
		// separates the data by states and nests the data for each individual party within each state
		partiesByState = d3.nest()
			.key(function(d) { return d.state })
			.key(function(d) { return d.party})
			.entries(year_data)

		// gets the total number of candidate votes for each individual party within each state and the total number of votes in each state
		graphData = partiesByState.map(state => { 
			partyMap = {}
			total = 0
			state.values.forEach(party => {
				partyTotal = 0
				party.values.forEach(county => {
					if (!Number.isNaN(parseInt(county.candidatevotes,10))) {
						partyTotal += parseInt(county.candidatevotes,10)
					}
				})
				partyMap[""+party.key] = partyTotal
				total += partyTotal
			})
			return {
				key: state.key,
				values: partyMap,
				total: total
			}
		})
		
		// stores the different parties
		parties = ['democrat', 'republican', 'green', 'NA']

		// creates the stacked data for the chart - each of the 4 "stacks" contains the y-value ranges for every x-value
		var stack = d3.stack()
			.keys(parties)
			.value((d,key) => {
				return d.values[key] || 0;
			})(graphData)

		// sorts data
		partiesByState.sort(function(x, y) {
			return d3.ascending(x.key, y.key);
		})

		// creates the x-axis scale
		x = d3.scaleBand()
			.domain(partiesByState.map(function(d) { return d.key}))
			.rangeRound([0, width - margin.left - margin.right])
			.paddingInner(0.05)
			.align(0.1);

		// creates the y-axis scale
		y = d3.scaleLinear()
			.domain([0, d3.max(graphData, function(d) { return d.total; })]).nice()
			.rangeRound([height - margin.top - margin.bottom, 0]);

		//creates the graph with specified dimensions and appends it to the svg selection
		graph = svg.append("svg")
			.style("width", width - 70 + "px")
			.style("height", height + "px")
			.attr("width", width - 70)
			.attr("height", (height + 100))
			.attr("viewBox", "0 0 " + width + " " + (height + 130))
			.append("g")
			.attr("transform","translate(" + 90 + ","+ 0 + ")")
			.attr("class", "svg");

		// positions the x-axis and axis labels and shows it on the graph
		graph.append("g")
			.attr("transform", "translate(0," + height + ")")
			.attr("class", "xaxis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x)
			.tickSize(0, 0)
			.tickSizeInner(0)
			.tickPadding(-3))
			.selectAll("text")
			.attr('dx', '-0.5em')
			.attr("transform", "rotate(-90)")
			.style("text-anchor", "end")

		// positions the y-axis and adds value ticks and shows it on the graph
		graph.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(0," + (19) + ")")
			.call(d3.axisLeft(y)
			.ticks(11)
			.tickSizeInner(0)
			.tickPadding(6)
			.tickSize(0, 0));

		// list of colors to separate each party
		COLORS = ['Blue', 'Red', 'Green', 'Orange']

		// maps each color to a party
		color = d3.scaleOrdinal()
			.domain(parties)
			.range(COLORS)

		// shows the bars in the chart using the stacked data 
		graph.append("g")
			.selectAll("g")
			.data(stack)
			.enter().append("g")
			.attr("fill", function(d) { return color(d.key); }) // fills each stack on every bar with the appropriate color 
			.selectAll("rect")
			.data(function(d) { return d; })
			.enter().append("rect") //loops through each stack in every bar and adds it with the specified dimensions
				.attr("x", function(d) { return x(d.data.key); })
				.attr("y", function(d) { return y(d[1])+20; })
				.attr("height", function(d) { return y(d[0]) - y(d[1]); })
				.attr("width",x.bandwidth())

		// creates the legend
		var legend = svg.selectAll(".legend")
			.data(parties)
			.enter()
			.append("g")

		// adds the legend title above the legend (Party)
		graph.append("text")
			.attr("font-size","12px")
			.attr("y", 5 )
			.attr("x", width / 2 + 177)
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Party")

		// shows and positions each of the 4 colors on the legend
		legend.append("rect")
			.attr("fill", color)
			.attr("width", 10)
			.attr("height", 10)
			.attr("y", function (d, i) {
				return i * 15 + 30;
			})
			.attr("x", 700);

		// adds the party label beside each color on the legend
		legend.append("text")
			.attr("class", "label")
			.attr("font-size","10px")
			.attr("y", function (d, i) {
				return i * 15 + 38;
			})
			.attr("dy", ".001em")
			.attr("x", 720)
			.attr("text-anchor", "start")
			.text(function (d, i) {
				return parties[i].charAt(0).toUpperCase() + parties[i].slice(1);
			});

		// adds the chart title
		graph.append("text")
			.attr("id", "electionTitle")
			.attr("y", 30)
			.attr("x", width / 3 + 35)
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Election Results : 2000")

		// adds the y-axis label
		graph.append("text")
			.attr("transform", "rotate(270)")
			.attr("y", -80)
			.attr("x", - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Number of Votes")

		// adds the x-axis label
		graph.append("text")
			.attr("y", 10 )
			.attr("x", width / 3 + 35)
			.attr("dy", "37em")
			.style("text-anchor", "middle")
			.text("State")
	}
	
	// initial vis setup
	tooltip.style.display = "none";
	createGraph();
	makeTotalPie();
	applyTooltip();

	/* FILTERING FUNCTIONALITY*/

	// click on filter data
	d3.select("#filterButton") 
		.on("click", function() {
			var cutoff = document.getElementById("cutoff");

			// hides bars with total less than inputed cutoff
			graph.selectAll("rect")
				.attr("visibility", "hidden")
				.attr("opacity", 0)
				.filter(function(d) {
					return d.data.total >= (cutoff.value * 1000000);
				})
				.transition()
				.duration(function(d) {
					return 1500;
				})
				.attr("opacity", 1)
				.attr("visibility", "visible")

			applyTooltip();
		})

	// click on change year 
	d3.select("#yearButton")
		.on("click", function() {

			// filters data to only include election data from selected year
			var yearOptions = document.getElementById("years");
			var yearSelected = yearOptions.value;

			// changes 
			year_data = data.filter(function(d) {
				return d.year == yearSelected;
			})

			// changes stacked bar chart and title to reflect selected year
			graph.remove();
			createGraph();
			d3.select("#electionTitle")
				.text("Election Results : " + yearSelected)

			applyTooltip();

			// changes pie chart to reflect selected year 
			pie.remove();
			makeTotalPie();
			document.getElementById("alphabetical").checked = "true";
		})
		
	// click on sort data
	d3.select("#sortButton")
		.on("click", function() {
			graph.select(".xaxis").remove();
			graph.selectAll("rect").remove();

			var sortChoices = document.getElementsByName("sort");
			var selectedSort;

			// stores selected sort choice
			for (var i = 0; i < sortChoices.length; i++) {
				if(sortChoices[i].checked) {
					selectedSort = sortChoices[i].value;
				}
			}

			// sorts bars to reflect selected sort choice
			if (selectedSort == "alphabetical") {
				partiesByState.sort(function(x, y) {
					return d3.ascending(x.key, y.key);
				})
			} else if (selectedSort == "ascending") {
				var array = [];
				graphData.sort(function(x, y) {
					return d3.ascending(x.total, y.total);
				})
				for (var i = 0; i < graphData.length; i++) {
					array.push(graphData[i].key);
				}
				partiesByState.sort(function(x, y) {
					return array.indexOf(x.key) - array.indexOf(y.key);
				})
			} else {
				var array = [];
				graphData.sort(function(x, y) {
					return d3.descending(x.total, y.total);
				})
				for (var i = 0; i < graphData.length; i++) {
					array.push(graphData[i].key);
				}
				partiesByState.sort(function(x, y) {
					return array.indexOf(x.key) - array.indexOf(y.key);
				})
			}

			// updates x-axis
			x = d3.scaleBand()
				.domain(partiesByState.map(function(d) { return d.key}))
				.rangeRound([0, width - margin.left - margin.right])
				.paddingInner(0.05)
				.align(0.1);

			// positions the x-axis and axis labels and shows it on the graph
			graph.append("g")
				.attr("transform", "translate(0," + height + ")")
				.attr("class", "xaxis")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x)
				.tickSize(0, 0)
				.tickSizeInner(0)
				.tickPadding(-3))
				.selectAll("text")
				.attr('dx', '-0.5em')
				.attr("transform", "rotate(-90)")
				.style("text-anchor", "end")

			// creates the stacked data for the chart - each of the 4 "stacks" contains the y-value ranges for every x-value
			var stack = d3.stack()
				.keys(parties)
				.value((d,key) => {
					return d.values[key];
				})(graphData)

			// shows the bars in the chart using the stacked data 
			graph.append("g")
				.selectAll("g")
				.data(stack)
				.enter().append("g")
				.attr("fill", function(d) { return color(d.key); }) // fills each stack on every bar with the appropriate color 
				.selectAll("rect")
				.data(function(d) { return d; })
				.enter().append("rect") //loops through each stack in every bar and adds it with the specified dimensions
					.attr("x", function(d) { return x(d.data.key); })
					.attr("y", function(d) { return y(d[1])+20; })
					.attr("height", function(d) { return y(d[0]) - y(d[1]); })
					.attr("width",x.bandwidth())

			applyTooltip();
		})

	//click on change state
	d3.select("#stateButton")
		.on("click", function(d) {
			pie.remove();
			makeStatePie();
		})

	//click on show total
	d3.select("#totalButton")
		.on("click", function(d) {
			pie.remove();
			makeTotalPie();
		})

	//click on reset
	d3.select("#resetButton")
		.on("click", function(d) {

			// resetting elements to intitial values
			document.getElementById("years").value = 2000;
			document.getElementById("cutoff").value = 1;
			document.getElementById("alphabetical").checked = "true";
			document.getElementById("states").value = "Alabama";

			// filters the data to only include election data from the year 2000
			year_data = data.filter(function(d) {
				return d.year == 2000;
			})

			// updates stacked bar chart
			graph.remove();
			createGraph();

			// updates pie chart
			pie.remove();
			makeTotalPie();

		})

	function applyTooltip() {
		tooltip = document.getElementById("tooltip");
		graph.selectAll("rect")
		.on("mouseover", function(d) {
			
			// highlights bar on hover
			d3.select(this).attr("stroke", "yellow").attr("stroke-width", 3);

			// displays tooltip box
			tooltip.style.display = null;

			// updates text of box with information of hovered bar
			if (d.data.key == "District of Columbia") {
				document.getElementById("label1").textContent = "State: " + "DC";
			} else {
				document.getElementById("label1").textContent = "State: " + d.data.key;
			}
			var count = d[1] - d[0];
			document.getElementById("label3").textContent = "Count: " + formatNum(count);
			var partyName;
			if (d.data.values.NA == count) {
				partyName = "NA";
			} else if (d.data.values.democrat == count) {
				partyName = "Democrat";
			} else if (d.data.values.republican == count) {
				partyName = "Republican";
			} else {
				partyName = "Green";
			}
			document.getElementById("label2").textContent = "Party: " + partyName;
		})
		.on("mouseout", function(d) {
			// turns off highlight of hovered bar and removes text
			d3.select(this).attr("stroke-width", 0);
			graph.select(".tooltip").remove();
			graph.select("#tooltipText").remove();

			// hides tooltip box
			tooltip.style.display = "none";
		})
	}

	// sets up state selection box
	var statesArray = [];
	for (var i = 0; i < graphData.length; i++) {
		statesArray.push(graphData[i].key);
	}
	statesArray.sort()
	var select = document.getElementById("states");

	// updates selection box with list of states
	for (var i = 0; i < statesArray.length; i++) {
		var option = statesArray[i];
		var element = document.createElement("option");
		element.textContent = option;
		element.value = option;
		select.appendChild(element);
	}

	// makes the state pie chart
	function makeStatePie() {

		// stores dimensions
		var pieWidth = 180;
		var pieHeight = 250;

		// creates svg with specified dimensions and appends it
		pie = d3.select("#leftbox")
			.append("svg")
				.attr("width", pieWidth)
				.attr("height", pieHeight)
				.attr("style", "-webkit-transform: translate(10px, 150px)")
				.attr("transform", "translate(10, 150)")
				

		var totalCount = 0;
		var rCount = 0;
		var dCount = 0;
		var gCount = 0;
		var naCount = 0;

		// change based on state selected
		for (var i = 0; i < graphData.length; i++) {
			if (document.getElementById("states").value == graphData[i].key) {
				totalCount = graphData[i].total;
				rCount = graphData[i].values.republican;
				dCount = graphData[i].values.democrat;
				gCount = graphData[i].values.green;
				naCount = graphData[i].values.NA;
			}
		}

		// checks if count for each party is defined
		if (Number.isNaN(rCount) || !rCount) rCount = 0;
		if (Number.isNaN(dCount) || !dCount) dCount = 0;
		if (Number.isNaN(gCount) || !gCount) gCount = 0;
		if (Number.isNaN(naCount) || !naCount) naCount = 0;

		// updates text with selected state data
		document.getElementById("pieLabel").textContent = "STATE"
		document.getElementById("totalLabel").textContent = "Total: " + formatNum(totalCount) + " (100%)";
		document.getElementById("dLabel").textContent = "Democrat: " + formatNum(dCount) + " (" + ((dCount/totalCount) * 100).toFixed(2) + "%)";
		document.getElementById("rLabel").textContent = "Republican: " + formatNum(rCount) + " (" + ((rCount/totalCount) * 100).toFixed(2) + "%)";
		document.getElementById("gLabel").textContent = "Green: " + formatNum(gCount) + " (" + ((gCount/totalCount) * 100).toFixed(2) + "%)";
		document.getElementById("naLabel").textContent = "NA: " + formatNum(naCount) + " (" + ((naCount/totalCount) * 100).toFixed(2) + "%)";

		// sets up pie and colors
		var pieData = {r: rCount, d: dCount, g: gCount, na: naCount};
		var pieColors = d3.scaleOrdinal()
			.domain(data)
			.range(["Orange", "Red", 'Blue', 'Green'])

		// creates pie chart data
		var pieChart = d3.pie()
			.value(function(d) {return d.value;})
		var readyData = pieChart(d3.entries(pieData))

		// creates the pie chart using data
		pie.selectAll("path")
			.data(readyData)
			.enter()
			.append("path")
			.attr("d", d3.arc()
				.innerRadius(0)
				.outerRadius(50)
			)
			.attr("fill", function(d) {return pieColors(d.data.key)})
			.attr("stroke", "black")
			.style("stroke-width", "1px")
			.style("opacity", .45)
			.attr("transform", "translate(90,80)")
	}

	// makes the total pie chart
	function makeTotalPie() {
		// stores dimensions
		var pieWidth = 180;
		var pieHeight = 250;

		// creates svg with specified dimensions and appends it
		pie = d3.select("#leftbox")
			.append("svg")
				.attr("width", pieWidth)
				.attr("height", pieHeight)
				.attr("style", "-webkit-transform: translate(10px, 150px)")
				.attr("transform", "translate(10, 150)")

		var totalCount = 0;
		var rCount = 0;
		var dCount = 0;
		var gCount = 0;
		var naCount = 0;

		// stores total count of each party for selected year
		for (var i = 0; i < graphData.length; i++) {
			totalCount += graphData[i].total;
			rCount += graphData[i].values.republican;
			dCount += graphData[i].values.democrat;
			gCount += graphData[i].values.green;
			naCount += graphData[i].values.NA;
		}

		//checks if count for each party is defined
		if (Number.isNaN(rCount) || !rCount) rCount = 0;
		if (Number.isNaN(dCount) || !dCount) dCount = 0;
		if (Number.isNaN(gCount) || !gCount) gCount = 0;
		if (Number.isNaN(naCount) || !naCount) naCount = 0;

		// sets up pie and colors
		var pieData = {r: rCount, d: dCount, g: gCount, na: naCount};
		var pieColors = d3.scaleOrdinal()
			.domain(data)
			.range(["Orange", "Red", 'Blue', 'Green'])

		// creates pie chart data
		var pieChart = d3.pie()
			.value(function(d) {return d.value;})
		var readyData = pieChart(d3.entries(pieData))

		// creates the pie chart using data
		pie.selectAll("path")
			.data(readyData)
			.enter()
			.append("path")
			.attr("d", d3.arc()
				.innerRadius(0)
				.outerRadius(50)
			)
			.attr("fill", function(d) {return pieColors(d.data.key)})
			.attr("stroke", "black")
			.style("stroke-width", "1px")
			.style("opacity", .45)
			.attr("transform", "translate(90,80)")

		// updates text with data for each party
		document.getElementById("pieLabel").textContent = "TOTAL";
		document.getElementById("totalLabel").textContent = "Total: " + formatNum(totalCount) + " (100%)";
		document.getElementById("dLabel").textContent = "Democrat: " + formatNum(dCount) + " (" + ((dCount/totalCount) * 100).toFixed(2) + "%)";
		document.getElementById("rLabel").textContent = "Republican: " + formatNum(rCount) + " (" + ((rCount/totalCount) * 100).toFixed(2) + "%)";
		document.getElementById("gLabel").textContent = "Green: " + formatNum(gCount) + " (" + ((gCount/totalCount) * 100).toFixed(2) + "%)";
		document.getElementById("naLabel").textContent = "NA: " + formatNum(naCount) + " (" + ((naCount/totalCount) * 100).toFixed(2) + "%)";
	}

	//adds commas to numbers
	function formatNum(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

})


