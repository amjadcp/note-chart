// init
const cy = cytoscape({
  container: document.getElementById("cy"),
  elements: [],
  style: [
    {
      selector: "node",
      style: {
        shape: "rectangle",
        "background-color": "lightblue",
        "border-color": "blue",
        "border-width": "1px",
        color: "black",
        content: "data(label)",
        "text-halign": "center",
        "text-valign": "center",
        width: "100px",
        height: "50px",
        "font-size": "14px",
        padding: "10px",
      },
    },
    {
      selector: "edge",
      style: {
        width: 3,
        "line-color": "#ddd",
        "target-arrow-color": "#ddd",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
      },
    },
  ],
  layout: {
    name: "cose",
    padding: 10,
  },
});

// Enable resizing for nodes
cy.resize({
  minWidth: 50,
  minHeight: 50,
  maxWidth: 300,
  maxHeight: 300,
});

document.getElementById("addNode").addEventListener("click", function () {
  var label = prompt("Enter node label:", "New Node") || "New Node";
  cy.add({
    group: "nodes",
    data: { label: label },
    position: {
      x: Math.random() * 400,
      y: Math.random() * 400,
    },
  });
});

let selectedNodes = [];
let selectedEdge = null;
let selectedNode = null;

cy.on("tap", "node", function (event) {
  var node = event.target;

  // Toggle selection
  if (selectedNodes.includes(node)) {
    selectedNodes = selectedNodes.filter((n) => n !== node);
    node.removeClass("selected");
  } else {
    if (selectedNodes.length < 2) {
      selectedNodes.push(node);
      node.addClass("selected");
    }
  }

  // If two nodes are selected, connect them
  if (selectedNodes.length === 2) {
    var source = selectedNodes[0];
    var target = selectedNodes[1];
    cy.add({
      group: "edges",
      data: {
        source: source.id(),
        target: target.id(),
      },
    });
    // Clear selection
    selectedNodes.forEach((n) => n.removeClass("selected"));
    selectedNodes = [];
  }
});

// Delete edge on right-click
cy.on("cxttap", "edge", function (event) {
  var edge = event.target;
  selectedEdge = edge;
  selectedNode = null;
  showContextMenu(event.clientX, event.clientY);
});

// Delete node on right-click
cy.on("cxttap", "node", function (event) {
  var node = event.target;
  selectedNode = node;
  selectedEdge = null;
  showContextMenu(event.clientX, event.clientY);
});

// Delete selected edge or node
document.getElementById("deleteEdge").addEventListener("click", function () {
  if (selectedEdge) {
    selectedEdge.remove(); // Remove the edge
    selectedEdge = null;
    hideContextMenu();
  }
});

document.getElementById("deleteNode").addEventListener("click", function () {
  if (selectedNode) {
    selectedNode.remove(); // Remove the node
    selectedNode = null;
    hideContextMenu();
  }
});

cy.on("tap", function (event) {
  if (event.target === cy) {
    // Clear selection if clicking on the background
    selectedNodes.forEach((n) => n.removeClass("selected"));
    selectedNodes = [];
    selectedEdge = null;
    selectedNode = null;
    hideContextMenu();
  }
});

const showContextMenu = (x, y) => {
  var menu = document.querySelector(".context-menu");
  menu.style.display = "block";
  menu.style.left = x + "px";
  menu.style.top = y + "px";
};

const hideContextMenu = () => {
  var menu = document.querySelector(".context-menu");
  menu.style.display = "none";
};

// export and import flowchart
document.getElementById("importJSON").addEventListener("click", function () {
  var jsonData = prompt("Paste your JSON data here:");

  if (jsonData) {
    try {
      var flowchartData = JSON.parse(jsonData);

      // Clear existing elements
      cy.elements().remove();

      // Add nodes
      flowchartData.nodes.forEach(function (node) {
        cy.add({
          group: "nodes",
          data: {
            id: node.id,
            label: node.label,
          },
          position: node.position,
          style: {
            width: node.size.width,
            height: node.size.height,
          },
        });
      });

      // Add edges
      flowchartData.edges.forEach(function (edge) {
        cy.add({
          group: "edges",
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
          },
        });
      });

      // Optionally, run a layout after importing
      cy.layout({ name: "cose" }).run();

      alert("Flowchart imported successfully!");
    } catch (e) {
      alert("Invalid JSON format. Please check your input.");
    }
  }
});

document.getElementById("exportJSON").addEventListener("click", function () {
  var flowchartData = {
    nodes: cy.nodes().map(function (node) {
      return {
        id: node.id(),
        label: node.data("label"),
        position: node.position(),
        size: {
          width: node.width(),
          height: node.height(),
        },
      };
    }),
    edges: cy.edges().map(function (edge) {
      return {
        id: edge.id(),
        source: edge.data("source"),
        target: edge.data("target"),
      };
    }),
  };

  var dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(flowchartData));
  var downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "flowchart.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});

// Modal functionality
var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];
var currentNode = null;

// Show modal on node click
cy.on("tap", "node", function (event) {
  currentNode = event.target;
  document.getElementById("nodeLabel").value = currentNode.data("label"); // Set current label in input
  modal.style.display = "block"; // Show modal
});

// Close modal
span.onclick = function () {
  modal.style.display = "none"; // Hide modal
};

// Save node label
document.getElementById("saveNodeLabel").addEventListener("click", function () {
  if (currentNode) {
    var newLabel = document.getElementById("nodeLabel").value;
    currentNode.data("label", newLabel); // Update node label
    currentNode.style("content", newLabel); // Update displayed content
    modal.style.display = "none"; // Hide modal
  }
});

// Close modal when clicking outside of it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
