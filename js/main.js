// selects the svg in the html body
var svg = d3.select("#svg");

// storing the dimensions and margins
var width = 1000;
var height = 500;
var margin = {top: 20, right: 190, bottom: 0, left: 40}

// D3 v4 loading syntax
d3.csv("./data/election.csv", function(data){

	// filters the data to only include election data from the year 2000
	var data_2000 = data.filter(function(d) {
		return d.year == 2000
	})

	// separates the data by states and nests the data for each individual party within each state
	var partiesByState = d3.nest()
		.key(function(d) { return d.state })
		.key(function(d) { return d.party})
		.entries(data_2000)

	// gets the total number of candidate votes for each individual party within each state and the total number of votes in each state
	var graphData = partiesByState.map(state => { 
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
	var parties = ['democrat', 'republican', 'green', 'NA']

	// creates the stacked data for the chart - each of the 4 "stacks" contains the y-value ranges for every x-value
	var stack = d3.stack()
		.keys(parties)
		.value((d,key) => {
			return d.values[key];
		})(graphData)

	// creates the x-axis scale
	var x = d3.scaleBand()
		.domain(partiesByState.map(function(d) { return d.key}))
		.rangeRound([0, width - margin.left - margin.right])
		.paddingInner(0.05)
		.align(0.1);

	// creates the y-axis scale
	var y = d3.scaleLinear()
		.domain([0, d3.max(graphData, function(d) { return d.total; })]).nice()
		.rangeRound([height - margin.top - margin.bottom, 0]);

	//creates the graph with specified dimensions and appends it to the svg selection
	var graph = svg.append("svg")
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
		.attr("class", "x axis")
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
	var color = d3.scaleOrdinal()
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
		.attr("x", width / 2 + 197)
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
		.attr("x", 720);

	// adds the party label beside each color on the legend
	legend.append("text")
		.attr("class", "label")
		.attr("font-size","10px")
		.attr("y", function (d, i) {
			return i * 15 + 38;
		})
		.attr("dy", ".001em")
		.attr("x", 740)
		.attr("text-anchor", "start")
		.text(function (d, i) {
			return parties[i].charAt(0).toUpperCase() + parties[i].slice(1);
		});

	// adds the chart title
	graph.append("text")
		.attr("y", 10 )
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
})


