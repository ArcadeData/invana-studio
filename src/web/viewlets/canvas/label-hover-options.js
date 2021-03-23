import React from "react";
import "./label-hover-options.scss";
import MenuComponent from "../../ui-components/menu";
import {Nav} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faEye, faEyeSlash, faSnowflake,  faTerminal, faTimesCircle,

} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";

export default class LabelHoverOptions extends React.Component {

    static propTypes = {
        onItemClick: PropTypes.func,
        hoveredLabelName: PropTypes.string,
        hoveredLabelType: PropTypes.string,
        history: PropTypes.object,
        startNewQueryInConsole: PropTypes.func,
        onClose: PropTypes.func,
        addToHiddenLabels: PropTypes.func,
        removeFromHiddenLabels: PropTypes.func,
        hiddenNodeLabels: PropTypes.array,
        hiddenEdgeLabels: PropTypes.array,
        canvasCtrl: PropTypes.object,

    }
    child = React.createRef();


    // navigateToLabelDetail(hoveredLabelName, hoveredLabelType) {
    //     let r = window.confirm("This will reload the view and switch the view to tables. Continue?");
    //     if (r === true) {
    //         const routeString = "/data/" + hoveredLabelType + "/" + hoveredLabelName;
    //         this.props.history.push(routeString);
    //     }
    // }

    checkIfLabelAlreadyHidden(hoveredLabelName, hoveredLabelType) {
        if (hoveredLabelType === "edge") {
            return this.props.hiddenEdgeLabels.includes(hoveredLabelName);
        } else if (hoveredLabelType === "vertex") {
            return this.props.hiddenNodeLabels.includes(hoveredLabelName);
        }
    }

    render() {
        return (
            <div className={"labelHoverOptions"} style={{'position': 'absolute', 'top': '0px', 'right': "0px"}}>
                <MenuComponent className={"bg-light"}>
                    <Nav className=" ">
                        <Nav.Item>
                            <Button size={"sm"} variant={"link"}
                                    onClick={() => this.props.onItemClick(this.props.hoveredLabelName, this.props.hoveredLabelType)}

                            >
                                <FontAwesomeIcon icon={faSnowflake}/>
                            </Button>
                        </Nav.Item>


                        <Nav.Item>
                            {
                                this.checkIfLabelAlreadyHidden(this.props.hoveredLabelName, this.props.hoveredLabelType)
                                    ? <Button size={"sm"} variant={"link"}
                                              onClick={() => {

                                                  this.props.removeFromHiddenLabels(this.props.hoveredLabelName, this.props.hoveredLabelType)
                                              }}
                                    > <FontAwesomeIcon icon={faEyeSlash}/>
                                    </Button>
                                    : <Button size={"sm"} variant={"link"}
                                              onClick={() => {
                                                  this.props.addToHiddenLabels(this.props.hoveredLabelName, this.props.hoveredLabelType);
                                              }}
                                    > <FontAwesomeIcon icon={faEye}/>
                                    </Button>
                            }

                        </Nav.Item>
                        {/*<Nav.Item style={{"display": "hidden"}}>*/}
                        {/*    <Button size={"sm"} variant={"link"}*/}
                        {/*            onClick={() => this.navigateToLabelDetail(this.props.hoveredLabelName, this.props.hoveredLabelType)}*/}
                        {/*    >*/}
                        {/*        <FontAwesomeIcon icon={faTable}/>*/}
                        {/*        /!*<FontAwesomeIcon icon={faExternalLinkSquareAlt}/>*!/*/}
                        {/*    </Button>*/}
                        {/*</Nav.Item>*/}


                        {
                            this.props.startNewQueryInConsole
                                ? <Nav.Item>
                                    <Button size={"sm"} variant={"link"}
                                            onClick={() => {
                                                if (this.props.hoveredLabelType === "edge") {
                                                    this.props.startNewQueryInConsole('g.E().hasLabel("' + this.props.hoveredLabelName + '")')
                                                } else if (this.props.hoveredLabelType === "vertex") {
                                                    this.props.startNewQueryInConsole('g.V().hasLabel("' + this.props.hoveredLabelName + '")')
                                                }
                                            }
                                            }
                                    >
                                        <FontAwesomeIcon icon={faTerminal}/>
                                    </Button>
                                </Nav.Item>
                                : <React.Fragment/>
                        }


                        <Nav.Item className={"ml-1 mr-1"}> |</Nav.Item>
                        <Nav.Item>
                            <Button size={"sm"} variant={"link"}
                                    onClick={() => this.props.onClose()}
                            >
                                <FontAwesomeIcon icon={faTimesCircle}/>
                            </Button>
                        </Nav.Item>
                    </Nav>
                </MenuComponent>
            </div>
        )
    }
}