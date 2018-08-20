/* eslint-disable react/no-danger */
import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import { debounce } from 'lodash';
import { changePage } from "../../actions/navigation";
import { CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE } from "../../actions/types";
import { getLogo } from "../framework/nav-bar";
import { datasetToText } from "./helpers";

/* regarding refs: https://reactjs.org/docs/refs-and-the-dom.html#exposing-dom-refs-to-parent-components */

const headerHeight = 85;
const progressHeight = 10;
const blockPadding = {
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingTop: "10px",
  paddingBottom: "10px"
};

const Header = (props) => {
  let inner;
  if (props.n !== 0) {
    const text = datasetToText(queryString.parse(props.query));
    inner = (
      <div style={{flexGrow: 1, color: "red", ...blockPadding}}>
        {text}
      </div>
    );
  } else {
    inner = (
      <div style={{flexGrow: 1, ...blockPadding}}>
        {"Introduction to header here?"}
      </div>
    );
  }
  return (
    <div
      id="Header"
      style={{
        height: `${headerHeight}px`,
        display: "flex",
        flexDirection: "row",
        fontSize: "14px",
        fontWeight: 100
      }}
    >
      {getLogo()}
      {inner}
    </div>
  );
};

const Progress = (props) => (
  <div
    id="Progress"
    style={{
      width: `${props.perc}%`,
      height: `${progressHeight-5}px`,
      backgroundColor: "#74a9cf",
      marginBottom: "5px"
    }}
  />
);


const Block = (props) => {
  return (
    <div
      id={`NarrativeBlock_${props.n}`}
      ref={props.inputRef}
      style={{
        ...blockPadding,
        flexBasis: "90%",
        flexShrink: 0
      }}
      className={props.focus ? "focus" : ""}
      dangerouslySetInnerHTML={props.block}
    />
  );
};

@connect((state) => ({
  loaded: state.narrative.loaded,
  blocks: state.narrative.blocks,
  currentInFocusBlockIdx: state.narrative.blockIdx
}))
class Narrative extends React.Component {
  constructor(props) {
    super(props);
    this.componentRef = undefined;
    this.blockRefs = [];
    this.scrollInProgress = false;
    this.disableScroll = () => {
      this.scrollInProgress = true;
    };
    this.enableScroll = () => {
      this.scrollInProgress = false;
    };
    this.onContainerScroll = debounce(() => {
      if (this.scrollInProgress) return;

      /* watch for when we should scroll down */
      const nextBlockIdx = this.props.currentInFocusBlockIdx+1;
      if (this.blockRefs[nextBlockIdx]) {
        const nextBlockYPos = this.blockRefs[nextBlockIdx].getBoundingClientRect().y;
        const threshold = this.props.height * 0.8;
        // console.log("onScroll (looking @ next block", this.props.currentInFocusBlockIdx+1, ")", nextBlockYPos, threshold)

        if (nextBlockYPos < threshold) {
          // console.log("onScroll detected DOWN threshold crossed");
          this.scrollToBlock(this.props.currentInFocusBlockIdx+1);
          return;
        }
      }

      /* watch for when we should scroll back up to the previous block */
      if (this.props.currentInFocusBlockIdx !== 0) {
        const thisBlockYPos = this.blockRefs[this.props.currentInFocusBlockIdx].getBoundingClientRect().y;
        const threshold = this.props.height * 0.2;
        // console.log("onScroll (scroll up?)", thisBlockYPos, threshold)
        if (thisBlockYPos > threshold) {
          // console.log("onScroll detected UP threshold crossed");
          this.scrollToBlock(this.props.currentInFocusBlockIdx-1);
        }
      }
    }, 200, {trailing: true});
  }
  scrollToBlock(blockIdx, {behavior="smooth", dispatch=true} = {}) {
    this.disableScroll();

    const absoluteBlockYPos = this.blockRefs[blockIdx].getBoundingClientRect().y - headerHeight - progressHeight;
    console.log(`scrollBy to ${parseInt(absoluteBlockYPos, 10)} (block ${blockIdx})`);
    this.componentRef.scrollBy({top: absoluteBlockYPos, behavior});
    window.setTimeout(this.enableScroll, 1000);
    if (dispatch) {
      this.props.dispatch(changePage({
        // path: this.props.blocks[blockIdx].dataset, // not yet implemented properly
        dontChangeDataset: true,
        query: queryString.parse(this.props.blocks[blockIdx].query),
        queryToDisplay: {n: blockIdx},
        push: true
      }));
    }
  }
  componentDidMount() {
    if (window.twttr && window.twttr.ready) {
      window.twttr.widgets.load();
    }
    /* if the query has defined a block to be shown (that's not the first)
    then we must scroll to that block */
    if (this.props.currentInFocusBlockIdx !== 0) {
      this.scrollToBlock(this.props.currentInFocusBlockIdx, {behavior: "instant", dispatch: false});
    }
  }
  renderHand(up) {
    const style = {zIndex: 200, position: "absolute", left: "40px", cursor: "pointer"};
    if (up) style.top = progressHeight + headerHeight;
    else style.bottom=0;
    const gotoIdx = up ? this.props.currentInFocusBlockIdx-1 : this.props.currentInFocusBlockIdx+1;
    return (
      <div onClick={() => this.scrollToBlock(gotoIdx)} style={style}>
        <svg width="40px" height="40px" viewBox="0 0 511.623 511.623" transform={up ? 'rotate(180)' : ''}>
          <path d="M455.387,182.438c-11.231-31.212-16.844-52.435-16.844-63.666V36.547c0-10.09-3.58-18.704-10.712-25.84
          C420.692,3.571,412.075,0,401.987,0H219.271c-10.088,0-18.702,3.571-25.841,10.707c-7.133,7.14-10.705,15.754-10.705,25.84v82.225
          c0,1.902-0.428,3.945-1.287,6.136s-2.19,4.43-3.999,6.711c-1.807,2.281-3.521,4.427-5.137,6.423s-3.756,4.283-6.423,6.851
          c-2.663,2.568-4.709,4.518-6.136,5.852c-1.425,1.334-3.472,3.14-6.139,5.424c-2.664,2.284-4.283,3.62-4.854,3.999
          c-14.082,12.37-26.362,21.888-36.829,28.549c-3.996,2.474-9.897,5.614-17.7,9.419c-7.804,3.809-14.655,7.331-20.557,10.566
          c-5.901,3.237-11.897,7.093-17.987,11.563c-6.091,4.471-10.8,9.707-14.134,15.703c-3.333,5.996-4.996,12.609-4.996,19.842
          c0,23.791,6.423,43.444,19.273,58.957c12.847,15.513,30.784,23.274,53.815,23.274c14.087,0,26.268-2.098,36.545-6.283v106.778
          c0,19.794,7.233,36.925,21.7,51.395c14.465,14.462,31.499,21.692,51.106,21.692c19.984,0,37.211-7.183,51.669-21.549
          c14.476-14.377,21.703-31.553,21.703-51.538v-48.252c12.368-1.331,23.688-4.856,33.969-10.568
          c4.004,0.575,8.097,0.856,12.278,0.856c19.411,0,36.351-5.805,50.819-17.416l1.431,0.281c26.648,0.194,47.342-8.087,62.092-24.839
          c14.756-16.744,22.124-38.633,22.124-65.661C475.077,248.767,468.518,218.594,455.387,182.438z M370.873,41.961
          c3.62-3.617,7.898-5.426,12.847-5.426s9.232,1.809,12.854,5.426c3.613,3.619,5.421,7.902,5.421,12.85
          c0,4.949-1.811,9.23-5.421,12.847c-3.621,3.615-7.905,5.424-12.854,5.424s-9.227-1.809-12.847-5.424
          c-3.614-3.617-5.421-7.895-5.421-12.847C365.452,49.859,367.259,45.576,370.873,41.961z M426.842,312.765
          c-7.812,9.233-19.8,13.847-35.977,13.847c-6.092,0-11.423-0.377-15.988-1.144c-3.046,5.716-8.042,10.232-14.989,13.565
          c-6.947,3.326-13.942,4.997-20.984,4.997c-7.036,0-13.607-1.712-19.698-5.141c-9.514,10.089-20.838,15.133-33.972,15.133
          c-10.852,0-20.66-3.34-29.412-9.999v94.499c0,9.897-3.615,18.466-10.85,25.7c-7.233,7.231-15.8,10.855-25.697,10.855
          c-9.708,0-18.225-3.724-25.553-11.143c-7.33-7.419-10.992-15.886-10.992-25.413V274.077c-3.809,0-8.423,1.428-13.849,4.281
          c-5.424,2.857-10.66,5.996-15.703,9.422c-5.042,3.425-11.516,6.566-19.414,9.421c-7.902,2.854-15.94,4.277-24.126,4.277
          c-12.753,0-22.029-4.229-27.836-12.703c-5.806-8.466-8.708-19.465-8.708-32.972c0-1.521,1.094-3.287,3.284-5.28
          c2.19-1.995,5.092-4.042,8.708-6.136c3.617-2.093,6.995-3.995,10.134-5.71c3.14-1.709,6.567-3.472,10.279-5.28
          c3.711-1.809,5.852-2.806,6.423-2.996c8.757-4.57,15.23-8.182,19.417-10.85c12.181-7.611,25.981-18.271,41.396-31.977
          c0.953-0.759,2.284-1.903,3.999-3.427c6.28-5.518,11.417-10.183,15.415-13.988c3.999-3.805,8.376-8.563,13.135-14.277
          c4.758-5.711,8.276-11.654,10.562-17.843c2.284-6.189,3.425-12.612,3.425-19.273v-9.136h182.723v9.136
          c0,13.706,3.046,29.597,9.137,47.679c6.092,18.083,12.183,36.545,18.274,55.389c6.092,18.843,9.138,36.26,9.138,52.248
          C438.546,290.638,434.635,303.532,426.842,312.765z"
          />
        </svg>
      </div>
    );
  }
  render() {
    if (!this.props.loaded) {return null;}

    return (
      <div id="NarrativeContainer">
        <Header
          query={this.props.blocks[this.props.currentInFocusBlockIdx].query}
          n={this.props.currentInFocusBlockIdx}
        />
        <Progress
          perc={(this.props.currentInFocusBlockIdx+1)/this.props.blocks.length*100}
        />
        {this.props.currentInFocusBlockIdx !== 0 ? this.renderHand(true) : null}
        {this.props.currentInFocusBlockIdx+1 !== this.props.blocks.length ? this.renderHand(false) : null}
        <div
          id="BlockContainer"
          className={"static narrative"}
          ref={(el) => {this.componentRef = el;}}
          onScroll={this.onContainerScroll}
          style={{
            height: `${this.props.height-headerHeight}px`,
            overflowY: "scroll",
            padding: "0px 0px 0px 0px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {this.props.blocks.map((b, i) => (
            <Block
              inputRef={(el) => {this.blockRefs[i] = el;}}
              key={b.__html.slice(0, 50)}
              block={b}
              n={i}
              focus={i === this.props.currentInFocusBlockIdx}
            />
          ))}
          <div style={{height: this.props.height * 0.4}}/>
        </div>
      </div>
    );
  }
  componentWillUnmount() {
    this.props.dispatch({
      type: CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE,
      pathname: this.props.blocks[this.props.currentInFocusBlockIdx].dataset,
      query: queryString.parse(this.props.blocks[this.props.currentInFocusBlockIdx].url)
    });
  }
}
export default Narrative;
