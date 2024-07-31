document.addEventListener("DOMContentLoaded", function () {
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
      {
        selector: "node.selected",
        style: {
          "background-color": "yellow",
        },
      },
      {
        selector: ".eh-handle",
        style: {
          "background-color": "red",
          width: 12,
          height: 12,
          shape: "ellipse",
          "overlay-opacity": 0,
          "border-width": 12, // makes the handle easier to hit
          "border-opacity": 0,
        },
      },

      {
        selector: ".eh-hover",
        style: {
          "background-color": "red",
        },
      },

      {
        selector: ".eh-source",
        style: {
          "border-width": 2,
          "border-color": "red",
        },
      },

      {
        selector: ".eh-target",
        style: {
          "border-width": 2,
          "border-color": "red",
        },
      },

      {
        selector: ".eh-preview, .eh-ghost-edge",
        style: {
          "background-color": "red",
          "line-color": "red",
          "target-arrow-color": "red",
          "source-arrow-color": "red",
        },
      },

      {
        selector: ".eh-ghost-edge.eh-preview-active",
        style: {
          opacity: 0,
        },
      },
    ],
    layout: {
      name: "cose",
      padding: 10,
    },
  });

  const eh = cy.edgehandles({
    snap: false,
  });

  document.querySelector('#draw-on').addEventListener('click', function() {
    eh.enableDrawMode();
  });

  document.querySelector('#draw-off').addEventListener('click', function() {
    eh.disableDrawMode();
  });

  // Create a new node
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

  // Modal functionality
  let modal = document.getElementById("myModal");
  let span = document.getElementsByClassName("close")[0];

  // Select nodes on left-click
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

  // Show delete button on right-click on edge
  cy.on("cxttap", "edge", function (event) {
    var edge = event.target;
    selectedEdge = edge;
    selectedNode = null;
    showDeleteButton("deleteEdge");
  });

  // Delete selected edge
  document.getElementById("deleteEdge").addEventListener("click", function () {
    if (selectedEdge) {
      selectedEdge.remove(); // Remove the edge
      selectedEdge = null;
      hideDeleteButton("deleteEdge");
    }
  });

  cy.on("tap", function (event) {
    if (event.target === cy) {
      // Clear selection if clicking on the background
      selectedNodes.forEach((n) => n.removeClass("selected"));
      selectedNodes = [];
      selectedEdge = null;
      selectedNode = null;
      hideDeleteButton("deleteEdge");
    }
  });

  // type = "deleteNode" or "deleteEdge"
  const showDeleteButton = (type) => {
    const button = document.querySelector("#" + type);
    button.style.display = "block";
    // button.style.left = x + "px";
    // button.style.top = y + "px";
  };

  // type = "deleteNode" or "deleteEdge"
  const hideDeleteButton = (type) => {
    const button = document.querySelector("#" + type);
    button.style.display = "none";
  };

  // open modal on right-click on node
  cy.on("cxttap", "node", function (event) {
    const node = event.target;
    selectedNode = node;
    selectedEdge = null;
    document.getElementById("nodeLabel").value = selectedNode.data("label"); // Set current label in input
    modal.style.display = "block"; // Show modal
  });

  // Edit selected node
  document
    .getElementById("saveNodeLabel")
    .addEventListener("click", function () {
      if (selectedNode) {
        var newLabel = document.getElementById("nodeLabel").value;
        selectedNode.data("label", newLabel); // Update node label
        selectedNode.style("content", newLabel); // Update displayed content
        modal.style.display = "none"; // Hide modal
      }
    });

  // Delete selected node
  document.getElementById("deleteNode").addEventListener("click", function () {
    if (selectedNode) {
      selectedNode.remove(); // Remove the node
      selectedNode = null;
      modal.style.display = "none"; // Hide modal
    }
  });

  // Close modal when clicking outside of it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  // Close modal
  span.onclick = function () {
    modal.style.display = "none"; // Hide modal
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
});
