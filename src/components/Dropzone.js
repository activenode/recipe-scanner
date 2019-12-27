import { Component } from 'inferno';

class Dropzone extends Component {
  state = {
    showDragoverLayer: false
  }

  render({ children }) {
    return (
      <div onDrop={e => this.onDrop(e)} onDragOver={e => this.onDragOver(e)} style={styles.dropzone}>
        {children}

        <div hidden={!this.state.showDragoverLayer} style={styles.dragoverLayer}></div>
      </div>
    );
  }

  onDragOver(e) {
    e.preventDefault();
    this.setState({
      showDragoverLayer: true
    });
  }

  onDrop(e) {
    e.preventDefault();
    console.log('droppi', e.dataTransfer.files);
  }
}

const styles = {
  dropzone: {
    'min-width': '100%',
    'min-height': '100vh'
  },
  dragoverLayer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'black'
  }
};

export default Dropzone;
