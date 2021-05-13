import React from "react";
import {Button, Form} from "react-bootstrap";
import PropTypes from "prop-types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faWindowClose} from "@fortawesome/free-solid-svg-icons";


export default class QueryConsole extends React.Component {


    static propTypes = {
        requestBuilder: PropTypes.object,
        canvasQueryString: PropTypes.string,
        makeQuery: PropTypes.func,
        connector: PropTypes.object,
        setLeftContentName: PropTypes.func,
        startNewQueryInConsole: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            canvasQueryString: this.props.canvasQueryString
        }
    }

    componentDidMount() {
        document.getElementsByTagName('textarea')[0].focus();
    }

    onEnterPress = (e) => {
        if (e.keyCode === 13 && e.shiftKey === true) {
            e.preventDefault();
            e.stopPropagation();
            this.formRef.dispatchEvent(new Event('submit'));
        }
    }

    componentDidUpdate(prevProps) {
        // Typical usage (don't forget to compare props):
        if (this.props.canvasQueryString !== prevProps.canvasQueryString) {
            console.log("this.props.query", this.props.canvasQueryString)
            const canvasQueryString = this.props.canvasQueryString.replace(/\\n/g, String.fromCharCode(13, 10))
            this.setState({canvasQueryString: canvasQueryString});
        }
    }

    onQueryChange(e) {

        this.props.startNewQueryInConsole(e.target.value);
        this.setState({canvasQueryString: e.target.value});
    }


    onFormSubmit(_this, e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("=====_this", _this);
        if (e.target.canvasQueryString.value) {
            const query = _this.props.connector.requestBuilder.rawQuery(e.target.canvasQueryString.value)
            const queryPayloadCleaned = this.props.connector.requestBuilder.combineQueries(query, null);
            _this.props.makeQuery(queryPayloadCleaned, {source: "console"});
        } else {
            alert("Query cannot be null")
        }
    }

    render() {
        return (
            <div className={" position-absolute  d-flex"} style={this.props.style}>
                <div className={" flex-fill ml-3 border bg-white"} style={{"height": "465px"}}>
                    <form ref={e => this.formRef = e} id={"queryForm"}
                          onSubmit={(e) => this.onFormSubmit(this, e)}>
                        <Form.Control as={"textarea"}
                                      autoComplete={"off"}
                                      className=" ml-0 pl-3 pr-3 flex-fill rounded-0 border-0"
                                      type={"text"}
                                      name={"canvasQueryString"}
                                      style={{"minHeight": "420px"}}
                                      placeholder="start your gremlin query here"
                                      spellCheck={false}
                                      autoFocus
                                      onChange={this.onQueryChange.bind(this)}
                                      onKeyDown={this.onEnterPress.bind(this)}
                                      value={this.state.canvasQueryString || ''}
                        />
                        <div className={"pl-3  pt-2 pb-2 pr-3 bg-white border-top"}>
                            <Button variant={"outline-primary position-relative pt-0 pb-0"} size="sm"
                                    type={"submit"}>Submit Query</Button>
                            <Button variant={"outline-secondary position-relative ml-2 pt-0 pb-0"}
                                    onClick={() => this.props.setLeftContentName(null)}
                                    size="sm">
                                <FontAwesomeIcon icon={faWindowClose}/>
                            </Button>
                        </div>
                    </form>
                    <div className="clearfix"/>
                </div>
            </div>
        )
    }
}