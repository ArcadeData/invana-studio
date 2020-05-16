// import React from "react";
// import * as d3 from 'd3';
// import 'd3-selection-multi'
// import GraphControls from "./controls-handler";
// import {DefaultHoverOpacity, DefaultNodeBgColor, DefaultLinkTextColor, DefaultLinkPathColor} from "../../config";
// import {LightenDarkenColor} from "../core/utils";
import {prepareNodesDataWithOptions, prepareLinksDataForCurves} from "./canvas-utils"
// import InvanaGraphUI from "./canvas";

import React from "react";
import * as d3 from 'd3';
import 'd3-selection-multi'
import GraphControls from "./controls-handler";
import {
    DefaultHoverOpacity,
    DefaultNodeBgColor,
    DefaultLinkTextColor,
    DefaultLinkPathColor,
    linkCurvature,
    linkFillColor, linkStrokeWidth, linkTextColor, nodeRadius, nodeStrokeWidth, linkDistance
} from "../../config";
import {LightenDarkenColor} from "../core/utils";

export default class GraphCanvas extends React.Component {

    html_selector_id = ".main-canvas";
    // NODE_ID_TO_LINK_IDS = {};
    // LINK_ID_TO_LINK = {};
    controls = new GraphControls();


    constructor(props) {
        super(props);

        this.state = {
            canvas: null,
        }
    }

    resetNodeHighlight(selectedNode) {
        let nodeElements = this.canvas.selectAll('.node');
        let linkElements = this.canvas.selectAll('.link');
        let linkLabels = this.canvas.selectAll('.edgelabel');

        nodeElements.style('opacity', '1');
        linkElements.style('opacity', '1');
        linkLabels.style('opacity', '1');
    }

    onNodeHoverOut(selectedNode) {
        this.resetNodeHighlight(selectedNode);

    }

    onNodeHoverIn(selectedNode) {
        this.highlightHoveredNodesAndEdges(selectedNode);
        // console.log("onNodeHoverIn", selectedNode);
    }

    showProperties(properties) {
        this.props.setSelectedData({
            "selectedData": properties,
            "showProperties": true
        })
    }

    hideProperties() {
        this.props.setSelectedData({
            "selectedData": {},
            "showProperties": false
        })
    }

    getAdjacentNodeIds(nodeId) {
        let _this = this;
        let connectedLinkIds = this.props.NODE_ID_TO_LINK_IDS[nodeId] || new Set();
        let data = new Set([nodeId]);
        connectedLinkIds.forEach(linkId => {
            let link = _this.props.LINK_ID_TO_LINK[linkId];
            data.add(link.source.id);
            data.add(link.target.id);
        });
        return data;
    }

    highlightHoveredNodesAndEdges(selectedNode) {
        // this is performance intensive operation
        let nodeElements = this.canvas.selectAll('.node');
        let linkElements = this.canvas.selectAll('.link');
        let linkLabels = this.canvas.selectAll('.edgelabel');


        let adjacentNodeIds = this.getAdjacentNodeIds(selectedNode.id);
        nodeElements.style('opacity', function (nodeElement) {
            return adjacentNodeIds.has(nodeElement.id) ? '1' : '0.1';
        });

        let adjacentLinkIds = this.getAdjacentLinkIds(selectedNode.id);
        linkElements.style('opacity', function (linkElement) {
            return adjacentLinkIds.has(linkElement.id) ? '1' : '0.1';
        });

        linkLabels.style('opacity', function (linkLabel) {
            return adjacentLinkIds.has(linkLabel.id) ? '1' : '0.1';
        });
    }

    getAdjacentLinkIds(nodeId) {
        return this.props.NODE_ID_TO_LINK_IDS[nodeId] || new Set();
    }

    expandInLinksAndNodes(selectedNode) {
        console.log("expandInLinksAndNodes", selectedNode);
        // TODO - improve performance of the query.


        let query_string = "node=g.V(" + selectedNode.id + ").toList(); " +
            "edges = g.V(" + selectedNode.id + ").outE().dedup().toList(); " +
            "other_nodes = g.V(" + selectedNode.id + ").outE().otherV().dedup().toList();" +
            "[other_nodes,edges,node]";

        this.props.queryGremlinServer(query_string);

        return false;

    }

    expandOutLinksAndNodes(selectedNode) {
        console.log("expandOutLinksAndNodes", selectedNode);
        // TODO - improve performance of the query.
        let query_string = "node=g.V(" + selectedNode.id + ").toList(); " +
            "edges = g.V(" + selectedNode.id + ").inE().dedup().toList(); " +
            "other_nodes = g.V(" + selectedNode.id + ").inE().otherV().dedup().toList();" +
            "[other_nodes,edges,node]";
        this.props.queryGremlinServer(query_string);
        return false;

    }

    closeNodeMenu(selectedNode) {
        console.log("closeNodeMenu clicked", selectedNode);
        this.hideProperties();
        d3.select(".node-menu").remove();
    }

    releaseNodeLock(selectedNode) {
        console.log("releaseNodeLock clicked", selectedNode);
        selectedNode.fixed = false;
        selectedNode.fx = null;
        selectedNode.fy = null;
        this.simulation.alpha(DefaultHoverOpacity).restart();

    }

    onNodeClicked(selectedNode) {
        console.log("onNodeClicked:: thisnode : selectedNode", selectedNode);
        let _this = this;
        let thisNode = d3.select("#node-" + selectedNode.id);
        d3.select(".node-menu").remove();


        var menuDataSet = [{
            id: 101,
            option_name: "not-assigned",
            title: "not assigned",
            html: "."
        }, {
            id: 102,
            option_name: "out-links",
            title: "out links",
            html: "&rarr;"
        }, {
            id: 103,
            option_name: "not-assigned",
            title: "not assigned",
            html: "."
        }, {
            id: 104,
            option_name: "close-node-menu",
            title: "Close Menu",
            html: "&#x2715;"
        }, {
            id: 105,
            option_name: "in-links",
            title: "in links",
            html: "&rarr;"
        }, {
            id: 106,
            option_name: "release-lock",
            title: "Release Lock",
            html: "&#x1f513;"
        }];

        // Barvy menu
        var pie = d3.pie()
            .sort(null)
            .value(function (d) {
                return Object.keys(menuDataSet).length;
            }); // zde je nutnÃ© zadat celkovou populaci - poÄetz prvkÅ¯ v

        // Menu
        var widthMenu = 180,
            heightMenu = 180,
            radiusMenu = Math.min(widthMenu, heightMenu) / 2;

        // Arc setting
        var arc = d3.arc()
            .innerRadius(radiusMenu - 70)
            .outerRadius(radiusMenu - 35);

        // Graph space
        var svgMenu = thisNode.append("svg")
            .attr("width", widthMenu)
            .attr("height", heightMenu)
            .attr("class", "node-menu")
            .attr("x", -90)
            .attr("y", -90)
            .append("g")
            .attr("transform", "translate(" + widthMenu / 2 + "," + heightMenu / 2 + ")");
        // Prepare graph and load data
        var g = svgMenu.selectAll(".arc")
            .data(pie(menuDataSet))
            .enter()
            .append("g")
            .attr("class", "arc")
            .attr("title", function (d) {

                return d.title;
            })
            .on("click", function (arch_node) {
                console.log("You clicked on: ", arch_node.data.option_name, " and its id is: ", arch_node.data.id);
                console.log("Its node is: ", selectedNode);
                if (arch_node.data.option_name === "out-links") {
                    _this.expandOutLinksAndNodes(selectedNode);
                } else if (arch_node.data.option_name === "in-links") {
                    _this.expandInLinksAndNodes(selectedNode);
                } else if (arch_node.data.option_name === "close-node-menu") {
                    _this.closeNodeMenu(selectedNode);
                } else if (arch_node.data.option_name === "release-lock") {
                    _this.releaseNodeLock(selectedNode);
                } else {
                    alert("not implemented");
                }
            });
        // .on("mouseover", function(d) {tip.hide(d);});

        // Add colors
        var path = g.append("path")
            .attr("d", arc)
            .attr("fill", function (d) {
                return "#333333"; // color(d.data.size);
            })
            .attr("stroke-width", "2px")
            .attr("stroke", function (d) {
                return "#333333"; // color(d.data.size);
            });

        // Add labels
        var labels = g.append("text")
            .attr("transform", function (d) {
                return "translate(" + arc.centroid(d) + ")";
            })
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .html(function (d) {
                return d.data.html;
            })
            .attr("title", function (d) {
                return d.data.title;
            })
            .attr("stroke", "#ffffff");


        g.append("title")
            .text(function (d) {
                return d.data.title;
            });


        // Add hover action
        path.on("mouseenter", function (d, i) {
            d3.select(this)
                .attr("fill", "#555555")
                .attr("cursor", "pointer")
                .attr("class", "on");
        });

        path.on("mouseout", function (d) {
            d3.select(this)
                .attr("fill", function (d) {
                    return "#333333";
                })
                .attr("class", "off");
        });
        this.showProperties(selectedNode);

    }

    getNodeLabelConfig(label) {
        try {
            return this.props.nodeLabels[label];

        } catch (e) {
            return {bgColor: DefaultNodeBgColor};
        }
    }

    getLinkLabelConfig(label) {
        try {
            return this.props.linkLabels[label];

        } catch (e) {
            return {pathColor: DefaultLinkPathColor, linkTextColor: DefaultLinkTextColor};
        }
    }

    addVertices(vertices) {

        console.log("VertexUtils.add", vertices, this.canvas);


        let _this = this;

        let nodes = this.canvas
            .append("g").attr("class", "nodes")
            .selectAll("g.nodes")
            .data(vertices)
            .enter().append("g")
            .attr("id", (d) => "node-" + d.id)
            .attr("cursor", "pointer")
            .attr("class", "node")
            // .call(d3.drag()
            //     .on("start", dragStarted)
            //     .on("drag", dragged)
            //     .on("end", dragEnded))
            .on("mouseover", (d) => _this.onNodeHoverIn(d))
            .on("mouseout", (d) => _this.onNodeHoverOut(d))
            .on("click", (d) => _this.onNodeClicked(d));

        // node first circle
        nodes.append("circle")
            .attr("r", (d) => d.meta.shapeOptions.radius)
            .attr("fill", (d) => d.meta.shapeOptions.fillColor)
            .attr("stroke", (d) => d.meta.shapeOptions.strokeColor)
            .attr("stroke-width", (d) => d.meta.shapeOptions.strokeWidth);


        // for bgImageUrl
        nodes.append('g')
            .attr("class", "bgImageUrl")
            .attr('transform', function (d) {
                    const side = 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4);
                    const dx = -1 * (side / 2) * 1.5;
                    // const dx = d.meta.shapeOptions.radius - (side / 2) * (2.5);
                    // const dy = d.meta.shapeOptions.radius - (side / 2) * (2.5) * (2.5 / 3) - 4;
                    return 'translate(' + [dx, dx] + ')'
                }
            )
            .append("foreignObject")
            .attr("width", (d) => 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4) * 2) // side
            .style("font-size", function (d) {
                return "12px";
            })
            .attr("height", (d) => 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4) * 2) // side
            .append("xhtml:body")

            .style("background-color", "transparent")
            .append("xhtml:span")
            .style("color", (d) => d.meta.shapeOptions.textColor)
            .style("background-color", "transparent")
            .style("padding-top", (d) => d.meta.shapeOptions.radius / 4)
            .html(function (d) {
                const side = 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4) * 1.5;
                if (d.meta.bgImageUrl) {
                    return "<img src='" + d.meta.bgImageUrl + "' style='width: " + side + "px; border-radius: 3rem;' />"
                }
            })

        // node bgImageUrl CAP ; this will create a border ring around the image on top of it. creating clean UI
        nodes.append("circle")
            .attr("class", "bgImageUrlCap")
            .attr("r", (d) => d.meta.shapeOptions.radius)
            .attr("fill", "transparent")
            .attr("stroke", (d) => d.meta.shapeOptions.strokeColor)
            .attr("stroke-width", (d) => d.meta.shapeOptions.strokeWidth + 1);


        // for nodeBgHtml - this will be on top of background image
        nodes.append('g')
            .attr("class", "nodeHTML")
            .attr('transform', function (d) {
                    const side = 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4);
                    const dx = -1 * (side / 2);
                    // const dx = d.meta.shapeOptions.radius - (side / 2) * (2.5);
                    // const dy = d.meta.shapeOptions.radius - (side / 2) * (2.5) * (2.5 / 3) - 4;
                    return 'translate(' + [dx, dx] + ')'
                }
            )
            .append("foreignObject")
            .attr("width", (d) => 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4)) // side
            .style("font-size", function (d) {
                return "12px";
            })
            .attr("height", (d) => 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4)) // side
            .append("xhtml:body")
            .style("color", (d) => d.meta.shapeOptions.textColor)
            .style("font-size", "16px") // make this dynamic based on the node radius also
            // .style("font-weight", "bold")
            .style("background-color", "transparent")
            .append("xhtml:span")
            .style("text-align", "center")
            .style("display", "block")
            .style("vertical-align", "middle")

            .style("color", (d) => d.meta.shapeOptions.textColor)
            .style("background-color", "transparent")
            .style("padding-top", (d) => d.meta.shapeOptions.radius / 4)
            .html(function (d) {
                if (d.meta.shapeOptions.inShapeHTML && !d.meta.bgImageUrl) {
                    return d.meta.shapeOptions.inShapeHTML
                }
            });

        //
        nodes.append('g')
            .attr("class", "tagHTML")
            .attr('transform', function (d) {
                    const side = 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4);
                    const dx = (side / 2);
                    // const dx = d.meta.shapeOptions.radius - (side / 2) * (2.5);
                    // const dy = d.meta.shapeOptions.radius - (side / 2) * (2.5) * (2.5 / 3) - 4;
                    return 'translate(' + [dx, dx - (d.meta.shapeOptions.radius / 4) + d.meta.shapeOptions.strokeWidth] + ')'
                }
            )
            .append("foreignObject")
            .attr("width", (d) => 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4)) // side
            .style("font-size", function (d) {
                return "12px";
            })
            .attr("height", (d) => 2 * d.meta.shapeOptions.radius * Math.cos(Math.PI / 4)) // side
            .append("xhtml:body")
            .style("color", (d) => d.meta.shapeOptions.textColor)
            .style("font-size", "16px") // make this dynamic based on the node radius also
            // .style("font-weight", "bold")
            .style("background-color", "transparent")
            .append("xhtml:span")
            .style("color", (d) => d.meta.shapeOptions.textColor)
            .style("background-color", "transparent")
            .html((d) => "<i class=\"fas fa-globe-africa\"></i>");


        nodes.append("title")
            .text(function (d) {
                return d.meta.labelOptions.labelText || d.id;
            })
        nodes.append("text")
            .attr("dy", -16)
            .attr("dx", 6)
            .text((d) => d.meta.labelOptions.labelText || d.id)
            .attr("stroke", (d) => d.meta.labelOptions.labelColor)
            .attr("fill", (d) => d.meta.labelOptions.labelColor)
            .style("font-size", (d) => "12px")
            .style("display", (d) => (d.meta.labelOptions.showLabel) ? "block" : "none")
        // .style("text-shadow", function (d, i) {
        //     return "1px 1px " + d3.rgb(d.meta.labelOptions.labelColor).darker(1);
        // });

        return nodes;

        // let node = this.canvas.selectAll(".node")
        //     .data(vertices)
        //     .enter()
        //     .append("g")
        //     .attr("class", "node")
        //     .style("z-index", "100")
        //     .attr("id", function (d) {
        //         return "node-" + d.id;
        //     });
        //
        // node.append("circle")
        //     .attr("r", 20)
        //     .style("fill", function (d, i) {
        //
        //         if (_this.getNodeLabelConfig(d.label)) {
        //             let vertexLabelConfig = _this.getNodeLabelConfig(d.label);
        //             if (vertexLabelConfig) {
        //                 return vertexLabelConfig.bgColor;
        //             }
        //         }
        //     })
        //
        // node.append("circle")
        //     .attr("r", 20)
        //     .style("fill", function (d, i) {
        //
        //         if (_this.getNodeLabelConfig(d.label)) {
        //             let vertexLabelConfig = _this.getNodeLabelConfig(d.label);
        //             if (vertexLabelConfig && vertexLabelConfig.bgImagePropertyKey) {
        //                 return "url(#pattern-node-" + d.id + ")";
        //             } else if (vertexLabelConfig && vertexLabelConfig.bgImageUrl) {
        //                 return "url(#pattern-node-" + d.id + ")";
        //             } else {
        //                 return vertexLabelConfig.bgColor;
        //             }
        //         }
        //     })
        //
        //     .style("stroke-width", "3px")
        //     .style("cursor", "pointer")
        //     .style("stroke", function (d) {
        //
        //         if (_this.getNodeLabelConfig(d.label)) {
        //             return LightenDarkenColor(_this.getNodeLabelConfig(d.label).bgColor, -50); // TODO - make this color darker ?
        //         } else {
        //             return DefaultNodeBgColor;
        //         }
        //     })
        //     .style("z-index", "100")
        //     .on("mouseover", function (d) {
        //         _this.onNodeHoverIn(d);
        //     })
        //     .on("mouseout", function (d) {
        //         _this.onNodeHoverOut(d);
        //     })
        //     .on("click", function (d) {
        //         _this.onNodeClicked(d);
        //     });
        //
        //
        // node.append('svg:defs').append('svg:pattern')
        //     .attr("id", function (d) {
        //         return "pattern-node-" + d.id + "";
        //     })
        //
        //     .attr('patternUnits', 'objectBoundingBox')
        //     .attr('width', 40)
        //     .attr('height', 40)
        //     .append('svg:image')
        //     .attr("xlink:href", function (d) {
        //         if (_this.getNodeLabelConfig(d.label)) {
        //             let vertexLabelConfig = _this.getNodeLabelConfig(d.label);
        //             if (vertexLabelConfig && vertexLabelConfig.bgImagePropertyKey) {
        //                 return d.properties[vertexLabelConfig.bgImagePropertyKey];
        //             } else if (vertexLabelConfig && vertexLabelConfig.bgImageUrl) {
        //                 return vertexLabelConfig.bgImageUrl;
        //             }
        //         }
        //         return "";
        //     })
        //     .attr('x', 0)
        //     .attr('y', 0)
        //     .attr('width', 40)
        //     .attr('height', 40);
        //
        //
        // node.append("title")
        //     .text(function (d) {
        //         return d.properties.name || d.id;
        //     });
        //
        // node.append("text")
        //     .attr("dy", -16)
        //     .attr("dx", 6)
        //     .text(function (d) {
        //         return d.properties.name || d.id;
        //     })
        //     .style("fill", function (d, i) {
        //         return "#c1c1c1";
        //     })
        //     .style("font-size", function (d, i) {
        //         return "12px";
        //     })
        //     .style("font-weight", function (d, i) {
        //         return "bold";
        //     })
        //     .style("text-shadow", function (d, i) {
        //         return "1px 1px #424242";
        //     });

        // return node;
    }

    onLinkMoveHover(selectedLink) {
        console.log("onLinkMoveHover", selectedLink);
        let nodeElements = this.canvas.selectAll('.node');
        let linkElements = this.canvas.selectAll('.link');

        linkElements.style('opacity', function (linkElement) {
            return selectedLink.id === linkElement.id ? '1' : '0.1';
        });

        let linkData = this.props.LINK_ID_TO_LINK[selectedLink.id];
        let adjacentNodeIds = new Set([linkData.source.id, linkData.target.id]);

        nodeElements.style('opacity', function (nodeElement) {
            return adjacentNodeIds.has(nodeElement.id) ? '1' : '0.1';
        });


        d3.select('#link-' + selectedLink.id).style('stroke', "black");
        this.showProperties(selectedLink);

    }

    onLinkMoveOut(selectedLink) {
        let nodeElements = this.canvas.selectAll('.node');
        let linkElements = this.canvas.selectAll('.link');

        nodeElements.style('opacity', '1');
        linkElements.style('opacity', '1');


        d3.select('#link-' + selectedLink.id).style('stroke', "#666");
        this.hideProperties();
    }

    addEdges(linksData) {

        let _this = this

        let links = this.canvas
            .append("g").attr("class", "links")
            .selectAll("g.links")
            .data(linksData)
            .enter().append("g")
            .attr("cursor", "pointer")

        const linkPaths = links
            .append("path")
            .attr("id", function (d, i) {
                return "link-" + d.id;
            })
            .attr("association-id", function (d, i) {
                return "link-" + (d.target.id || d.target) + "-" + (d.source.id || d.source);
            })
            .attr("sameIndexCorrected", function (d, i) {
                return d.sameIndexCorrected;
            })
            .attr('stroke', linkFillColor)
            .attr("stroke-width", linkStrokeWidth)
            .attr("fill", "transparent")
            .attr('marker-end', (d, i) => 'url(#link-arrow-' + d.id + ')')
            .on("mouseover", (d) => _this.onLinkMoveHover(d))
            .on("mouseout", (d) => _this.onLinkMoveOut(d));

        links.append("svg:defs")
            .append("svg:marker")
            .attr("id", (d, i) => "link-arrow-" + d.id)
            .attr("viewBox", "0 -5 10 10")
            .attr("refY", 0)
            .attr("refX", (d, i) => (nodeRadius - (nodeRadius / 4) + nodeStrokeWidth))
            .attr("fill", (d) => linkFillColor)
            .attr("stroke", (d) => linkFillColor)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")

            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        const linkText = links
            .append("text")
            .attr("dy", -4)
            .append("textPath")
            .attr("xlink:href", function (d, i) {
                return "#link-" + d.id;
            })
            .style("text-anchor", "middle")
            .attr("startOffset", "50%")
            .attr('fill', linkTextColor) // TODO add .meta for links also
            .attr('stroke', linkTextColor)
            .text((d, i) => `${d.label || d.id}`);


        // let link = this.canvas.selectAll(".link")
        //
        //     .data(edges)
        //     .enter()
        //     .append("line")
        //     .attr("class", "link")
        //     .attr('marker-end', 'url(#arrowhead)')
        //     .on('mouseover', function (d) {
        //         _this.onLinkMoveHover(d);
        //     })
        //     .on('mouseout', function (d) {
        //         _this.onLinkMoveOut(d);
        //     })
        //     .attr('id', function (d, i) {
        //         return 'link-' + d.id;
        //     })
        //     .style('stroke-width', 2)
        //     .style('cursor', 'pointer')
        //     .style('stroke', DefaultLinkPathColor);
        //
        // // link.append("title")
        // //     .text(function (d) {
        // //         return d.label;
        // //     });
        //
        // let edgepaths = this.canvas.selectAll(".edgepath")
        //     .data(edges)
        //     .enter()
        //     .append('path')
        //     .attrs({
        //         'class': 'edgepath',
        //         // 'fill-opacity': 0,
        //         // 'stroke-opacity': 0,
        //         'id': function (d, i) {
        //             return 'edgepath-' + d.id;
        //         }
        //     })
        //     .style("fill", function (d, i) {
        //         // return _this.color_schema(d);
        //         let linkLabelConfig = _this.getLinkLabelConfig(d.label);
        //         if (linkLabelConfig) {
        //             return linkLabelConfig.pathColor;
        //         } else {
        //             return DefaultLinkPathColor;
        //         }
        //     })
        //     // .style("stroke", "#777")
        //     // .style("stroke-width", "2px")
        //     .style("pointer-events", "none");
        //
        // let edgelabels = this.canvas.selectAll(".edgelabel")
        //     .data(edges)
        //     .enter()
        //     .append('text')
        //     .style("pointer-events", "none")
        //     .attr("dy", -3) //Move the text up/ down
        //     .style("fill", function (d, i) {
        //         let linkLabelConfig = _this.getLinkLabelConfig(d.label);
        //         if (linkLabelConfig) {
        //             return linkLabelConfig.linkTextColor;
        //         } else {
        //             return DefaultLinkTextColor;
        //         }
        //     })
        //     .attrs({
        //         'class': 'edgelabel',
        //         'id': function (d, i) {
        //             return 'edgelabel-' + d.id;
        //         },
        //         'font-size': 12,
        //     });
        //
        // edgelabels.append('textPath')
        //     .attr('xlink:href', function (d, i) {
        //         return '#edgepath-' + d.id;
        //     })
        //     .style("text-anchor", "middle")
        //     // .style("text-transform", "uppercase")
        //     .style("background", "#ffffff")
        //     .style("pointer-events", "none")
        //     .attr("startOffset", "50%")
        //     .style("fill", function (d, i) {
        //         // return _this.color_schema(d);
        //         let linkLabelConfig = _this.getLinkLabelConfig(d.label);
        //         if (linkLabelConfig) {
        //             return linkLabelConfig.linkTextColor;
        //         } else {
        //             return DefaultLinkTextColor;
        //
        //         }
        //     })
        //     .text(function (d) {
        //         return d.label;
        //     });

        return [links, linkPaths, linkText];
    }

    setupSimulation(canvas_width, canvas_height) {

        let forceCollide = d3.forceCollide()
            .radius(function (d) {
                return d.radius + 1.2;
            })
            .iterations(1); /// TODO - revisit this
        const forceX = d3.forceX(canvas_width / 2).strength(0.040);
        const forceY = d3.forceY(canvas_height / 2).strength(0.040);

        let getSimulationCharge = function () {
            return d3.forceManyBody()
                .strength(-600);
        }

        return d3.forceSimulation()

            .force("charge", getSimulationCharge())
            .force("collide", forceCollide)
            .force('x', forceX)
            .force('y', forceY)
            .force("center", d3.forceCenter(canvas_width / 2, canvas_height / 2))
            // .velocityDecay(0.4)
            .alphaTarget(0.1);
    }

    setupCanvas() {
        d3.select(this.html_selector_id).selectAll("*").remove();

        d3.select(this.html_selector_id).selectAll('g').remove();

        let svg = d3.select(this.html_selector_id)
            // .selectAll("*").remove()
            .call(d3.zoom().on("zoom", function () {
                svg.attr("transform", d3.event.transform);
            }))
            .on("dblclick.zoom", null)   // double click zoom has been disabled since
            // we want double click to be reserved for highlighting neighbor nodes
            .append("g")
            .attr("class", "everything");

        // on clicking on any node or link, remove the context menu that is opened in the canvas.
        // svg.select('*:not(circle), *:not(line), *:not(path), *:not(text), *:not(link)').on("click", function () {
        //     d3.select(".node-menu").remove();
        // });
        return svg;
    }

    setupMarker(canvas) {

        // canvas.append('defs').append('marker')
        //     .attrs({
        //         'id': 'arrowhead',
        //         'viewBox': '-0 -5 10 10',
        //         'refX': 23,
        //         'refY': 0,
        //         'orient': 'auto',
        //         'markerWidth': 8,
        //         'markerHeight': 9,
        //         'xoverflow': 'visible'
        //     })
        //     .append('svg:path')
        //     .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        //     .attr('fill', DefaultNodeBgColor)
        //     .style('stroke', 'none');
        return canvas;

    }

    startFreshCanvas() {
        let canvas = this.setupCanvas();
        return this.setupMarker(canvas);
    }

    startRenderingGraph(nodesData, linksData) {
        // add this data to the existing data


        let _this = this;

        let _ = this.addEdges(linksData);
        let link = _[0];
        let edgepaths = _[1];
        let edgelabels = _[2];

        let nodes = this.addVertices(nodesData);


        nodes
            .on("dblclick", function (d) {
                d.fixed = false;
                if (!d3.event.active) {
                    _this.simulation.alphaTarget(DefaultHoverOpacity).restart();
                }
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
            );


        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragstarted(d) {
            if (!d3.event.active) {
                _this.simulation.alphaTarget(DefaultHoverOpacity).restart();
            }
            d.fx = d.x;
            d.fy = d.y;

        }

        function dragended(d) {
            if (!d3.event.active) {
                _this.simulation.alphaTarget(0);
            }
            _this.simulation.alpha(DefaultHoverOpacity).restart();
            // d.fx = null;
            // d.fy = null;
        }

        d3.select('#center-canvas').on('click', function () {
            _this.controls.center(_this);
        });

        function linkArc(d) {
            // console.log("linkArc triggered", JSON.stringify(d));
            let dx = (d.target.x - d.source.x),
                dy = (d.target.y - d.source.y),
                dr = Math.sqrt(dx * dx + dy * dy),
                unevenCorrection = (d.sameUneven ? 0 : 0.5),
                arc = ((dr * d.maxSameHalf) / (d.sameIndexCorrected - unevenCorrection)) * linkCurvature;
            if (d.sameMiddleLink) {
                arc = 0;
            }
            console.log("linkArc", "M" + d.source.x + "," + d.source.y + "A" + arc + "," + arc + " 0 0," + d.sameArcDirection + " " + d.target.x + "," + d.target.y);
            return "M" + d.source.x + "," + d.source.y + "A" + arc + "," + arc + " 0 0," + d.sameArcDirection + " " + d.target.x + "," + d.target.y;
        }

        function ticked() {
            // link.attr("d", linkArc)
            // link
            //     .attr("transform", d => `translate(${d.x}, ${d.y})`);


            link
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            //


            nodes
                .attr("transform", d => `translate(${d.x}, ${d.y})`);

            edgepaths.attr("d", linkArc)

            // edgelabels.attr('transform', function (d) {
            //     if (d.target.x < d.source.x) {
            //         let bbox = this.getBBox();
            //
            //         let rx = bbox.x + bbox.width / 2;
            //         let ry = bbox.y + bbox.height / 2;
            //         return 'rotate(180 ' + rx + ' ' + ry + ')';
            //     } else {
            //         return 'rotate(0)';
            //     }
            // });
        }


        this.simulation
            .nodes(nodesData)
            .on("tick", ticked);
        //
        //   this.simulation.force("link", d3.forceLink()
        //           .id(function (d) {
        //               return d.id;
        //           })
        //           .distance(180).strength(1)
        //       ).force("link")
        //       .links(linksData);
        this.simulation.force("link", d3.forceLink().links(linksData)
            .id((d, i) => d.id)
            .distance(linkDistance));


        // function ticked() {
        //     link
        //         .attr("x1", function (d) {
        //             return d.source.x;
        //         })
        //         .attr("y1", function (d) {
        //             return d.source.y;
        //         })
        //         .attr("x2", function (d) {
        //             return d.target.x;
        //         })
        //         .attr("y2", function (d) {
        //             return d.target.y;
        //         });
        //
        //
        //     node
        //         .attr("transform", function (d) {
        //             return "translate(" + d.x + ", " + d.y + ")";
        //         });
        //
        //     edgepaths.attr('d', function (d) {
        //         return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
        //     });
        //
        //     edgelabels.attr('transform', function (d) {
        //         if (d.target.x < d.source.x) {
        //             let bbox = this.getBBox();
        //
        //             let rx = bbox.x + bbox.width / 2;
        //             let ry = bbox.y + bbox.height / 2;
        //             return 'rotate(180 ' + rx + ' ' + ry + ')';
        //         } else {
        //             return 'rotate(0)';
        //         }
        //     });
        // }


    }


    componentDidUpdate(prevProps) {

        this.canvas = this.startFreshCanvas();
        this.canvasDimensions = document.querySelector(this.html_selector_id).getBoundingClientRect();
        this.color_schema = d3.scaleOrdinal(d3.schemeCategory10);
        this.simulation = this.setupSimulation(this.canvasDimensions.width, this.canvasDimensions.height);


        const nodesData = prepareNodesDataWithOptions(this.props.nodes, {});
        const linksData = prepareLinksDataForCurves(this.props.links);

        console.log("this--nodesData==", nodesData)
        console.log("this--linksData==", linksData)

        this.startRenderingGraph(nodesData, linksData)
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.isDataChanged
    }

    render() {
        let canvasClass = this.html_selector_id.replace(".", "");
        return (

            <svg className={canvasClass}></svg>

        )
    }
}