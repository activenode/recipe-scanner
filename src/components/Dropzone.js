import { Component } from 'inferno';

class Dropzone extends Component {
  state = {
    showDragoverLayer: false
  }

  render({ children }) {
    return (
      <div 
        onDrop={e => {
          e.preventDefault();

          this.setState({
            showDragoverLayer: false
          });

          this.props.onDrop(e.dataTransfer);
        }} 
        onDragOver={e => this.onDragOver(e)} 
        onMouseOut={e => this.resetOverlay(e)}
        style={styles.dropzone}>
        {children}

        <div hidden={!this.state.showDragoverLayer} style={styles.dragoverLayer}></div>
      </div>
    );
  }

  resetOverlay(e) {
    if (!this.state.showDragoverLayer) return false;

    e.preventDefault();
    this.setState({
      showDragoverLayer: false
    });
  }

  onDragOver(e) {
    e.preventDefault();
    this.setState({
      showDragoverLayer: true
    });
  }
}

const styles = {
  dropzone: {
    'width': '100%',
    'min-height': '100vh'
  },
  dragoverLayer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.6)',
  }
};

export default Dropzone;
