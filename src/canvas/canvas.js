import React from "react";
import PropTypes from "prop-types";
import ErrorBoundary from "./error-boundary";
import PIXICanvas from "./graph/pixi-canvas";
import JSONCanvas from "./json/json";
import TableCanvas from "./table/table";
import RawResponsesCanvas from "./raw-response/raw-responses";
import CanvasNav from "./canvas-nav";
import CanvasController from "./controller";
import FocusedNodesList from "./graph/focused-nodes-list";

export default class Canvas extends React.Component {

    static defaultProps = {
        setHideVertexOptions: () => console.error("setHideVertexOptions not set",),
        setSelectedElementData: (selectedData) => console.error("setSelectedElementData not set", selectedData),
        setRightContentName: (contentName) => console.error("setRightContentName not set", contentName),
        setMiddleBottomContentName: (contentName) => console.error("setMiddleBottomContentName not set", contentName),
        middleBottomContentName: null,
        selectedElementData: null,
        setStatusMessage: (message) => console.debug("setStatusMessage not set", message),
        showVertexOptions: (selectedLabel) => console.debug("this.showVertexOptions not set", selectedLabel),

        connector: false,
        dataStore: null,
        resetShallReRenderD3Canvas: () => console.log("resetShallReRenderD3Canvas"),
        shallReRenderD3Canvas: false,
        makeQuery: () => console.error("makeQuery not set"),
        flushCanvas: () => console.error("flushCanvas not set"),
        setShallReRenderD3Canvas: (status) => console.error("setShallReRenderD3Canvas not set", status),

        // setFocusedNodes: (nodes) => console.error("setFocusedNodes not set"),
    }

    static propTypes = {
        setSelectedElementData: PropTypes.func,
        setMiddleBottomContentName: PropTypes.func,
        setHideVertexOptions: PropTypes.func,
        setRightContentName: PropTypes.func,
        requestBuilder: PropTypes.object,
        dataStore: PropTypes.object,
        connector: PropTypes.object,
        middleBottomContentName: PropTypes.string,

        showVertexOptions: PropTypes.func,
        shallReRenderD3Canvas: PropTypes.bool,
        makeQuery: PropTypes.func,

        resetShallReRenderD3Canvas: PropTypes.func,
        selectedElementData: PropTypes.object,
        setStatusMessage: PropTypes.func,

        flushCanvas: PropTypes.func,
        setShallReRenderD3Canvas: PropTypes.func,

        // setFocusedNodes: PropTypes.func
    }

    constructor(props) {
        super(props);
        this.state = {
            canvasType: "graph",
            graphicsEngine: null,
            focusedNodes: [] //
        }
        // this.updateCanvasState = this.updateCanvasState.bind(this)
        this.canvasCtrl = new CanvasController(this.props.connector,
            this.dataStore,
            this.updateCanvasState.bind(this),
            this.props.setStatusMessage,
            this.props.flushCanvas,
            this.props.setShallReRenderD3Canvas,
        );


    }

    setFocusedNodes(nodes) {
        this.setState({focusedNodes: nodes});
    }

    getFocusedNodes() {
        return this.state.focusedNodes;
    }

    updateCanvasState(message) {
        this.setState(message);
    }

    setGraphicsEngine(graphicsEngine) {
        this.setState({graphicsEngine: graphicsEngine})
    }

    getGraphicsEngine() {
        return this.state.graphicsEngine;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

        document.querySelector(".main-content-body").addEventListener("contextmenu ", function () {
            console.log("Right Click");
            return false;
        });
    }

    removeFocusedNode(nodeId) {
        //

        let graphicsEngine = this.getGraphicsEngine();
        let focusedNodes = graphicsEngine.dataStore.getUniqueFocusedNodes();
        graphicsEngine.dataStore.removeNodeFromFocus(nodeId);
        let indexId = null
        focusedNodes.forEach((focusedNode, index) => {
            if (focusedNode.id === nodeId) {
                indexId = index
                return index;
            }
        });
        focusedNodes.splice(indexId, 1);
        console.log("===indexId", indexId);
        console.log("focusedNodes removed", focusedNodes);
        graphicsEngine.graphicsStore.focusOnNodes(focusedNodes);
        this.setFocusedNodes(focusedNodes);
    }


    render() {
        return (

            <div
                style={{
                    height: "inherit"
                }}
            >

                <CanvasNav
                    canvasType={this.state.canvasType}
                    canvasCtrl={this.canvasCtrl}
                    makeQuery={this.props.makeQuery}
                    connector={this.props.connector}
                    dataStore={this.props.dataStore}
                    getGraphicsEngine={this.getGraphicsEngine.bind(this)}
                    setFocusedNodes={this.setFocusedNodes.bind(this)}
                    // switchCanvasTo={this.switchCanvasTo.bind(this)}
                    // confirmFlushCanvas={this.confirmFlushCanvas.bind(this)}
                    // confirmRedrawCanvas={this.confirmRedrawCanvas.bind(this)}
                />

                <div className={"main-content-body"}>
                    {
                        this.state.canvasType === "graph" && this.props.connector.getLastResponse()
                            ? <FocusedNodesList focusedNodes={this.state.focusedNodes}
                                                removeFocusedNode={this.removeFocusedNode.bind(this)}/>
                            : <span></span>
                    }

                    <ErrorBoundary>
                        {(() => {
                            if (this.state.canvasType === "graph" && this.props.connector.getLastResponse()) {
                                return (
                                    <div style={{"width": "100%", "height": "100%"}}>
                                        <PIXICanvas
                                            // setShowVertexOptions={this.setShowVertexOptions.bind(this)}
                                            setHideVertexOptions={this.props.setHideVertexOptions}
                                            setSelectedElementData={this.props.setSelectedElementData}
                                            setRightContentName={this.props.setRightContentName}
                                            setMiddleBottomContentName={this.props.setMiddleBottomContentName}
                                            middleBottomContentName={this.props.middleBottomContentName}

                                            selectedElementData={this.props.selectedElementData}
                                            setStatusMessage={this.props.setStatusMessage}

                                            setGraphicsEngine={this.setGraphicsEngine.bind(this)}
                                            connector={this.props.connector}
                                            dataStore={this.props.dataStore}
                                            resetShallReRenderD3Canvas={this.props.resetShallReRenderD3Canvas}
                                            shallReRenderD3Canvas={this.props.shallReRenderD3Canvas}
                                            makeQuery={this.props.makeQuery}
                                            setFocusedNodes={this.setFocusedNodes.bind(this)}
                                            getFocusedNodes={this.getFocusedNodes.bind(this)}
                                        />


                                    </div>
                                )
                            } else if (this.state.canvasType === "json" && this.props.connector.getLastResponse()) {
                                return (
                                    <JSONCanvas
                                        dataStore={this.props.dataStore}
                                    />
                                )
                            } else if (this.state.canvasType === "table" && this.props.connector.getLastResponse()) {
                                return (
                                    <TableCanvas
                                        dataStore={this.props.dataStore}
                                    />
                                )
                            } else if (this.state.canvasType === "raw" && this.props.connector.getLastResponse()) {
                                return (
                                    <RawResponsesCanvas
                                        connector={this.props.connector}
                                    />
                                )
                            } else {
                                return (
                                    <span></span>
                                )
                            }
                        })()}
                    </ErrorBoundary>


                </div>
            </div>

        )
    }
}