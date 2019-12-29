import { Component } from 'inferno';

class RecipeImageMarker extends Component {
  canvasElement = null;
  currentScaleFactor = 1;

  state = {
    imageSelections: []
  }

  onUpdate() {
    if (this.canvasElement) {
      console.log('being called');
      requestAnimationFrame(() => {
        const ctx = this.canvasElement.getContext('2d');
        const { width, height } = this.canvasElement.getBoundingClientRect();

        const img = this.props.imageData.imageRef.cloneNode();

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      })
    }
  }
  
  onSizeUpdate() {
    const { originalWidth, originalHeight } = this.props.imageData;
    const { width: canvasWidth } = this.canvasElement.getBoundingClientRect();
    let drawWidth,
      drawHeight;

    if ( originalWidth <= canvasWidth ) {
      drawWidth = originalWidth;
      drawHeight = originalHeight;
    } else {
      // is apparently bigger. lets scale it down.
      this.currentScaleFactor = canvasWidth / originalWidth;
      drawWidth = canvasWidth;
      drawHeight = this.currentScaleFactor * originalHeight;
    }

    this.canvasElement.setAttribute('width', drawWidth);
    this.canvasElement.setAttribute('height', drawHeight);
  }

  componentDidUpdate() {
    this.onUpdate();
  }

  componentDidMount() {
    this.onUpdate();
  }

  canvasRefCallback(canvasElement) {
    if (canvasElement) {
      this.canvasElement = canvasElement;
      this.onSizeUpdate();
    }
  }

  render() {
    return (
      <div>
        <div style={style.editorLayer}>
          <div style={style.imgEditorContainer}>
            <canvas 
              ref={el => this.canvasRefCallback(el)} style={{ width: '100%', border: '4px dashed black' }}>

            </canvas>
            <div style={{...(style.imageSelectionsBox)}}>
              {this.state.imageSelections}
            </div>
          </div>

          <div style={style.editorMenu}>
            <a role='button' style={style.editorMenuBtn}>x</a>
          </div>
        </div>
      </div>
    );
  }
}

const style = {
  editorLayer: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    position: 'fixed',
    background: 'rgba(255, 255, 255, 0.8)',
    'z-index': 20,
    'overflow-y': 'scroll',
  },
  imgEditorContainer: {
    'margin-top': '4ex',
    position: 'relative',
    width: 'calc(100% - 180px)',
    'margin-left': 'auto',
    'margin-right': 'auto',
  },
  imageSelectionsBox: {
    position: 'absolute',
    width: '100%',
    top: 0,
    left: 0,
    height: '100%',
    'z-index': '21',
  },
  editorMenu: {
    background: 'rgba(0,0,0,0.8)',
    padding: '1ex',
    width: '50px',
    position: 'fixed',
    top: '4ex',
    right: '10px',
    display: 'flex',
    'border-radius': '5px',
    'flex-direction': 'column',
  },
  editorMenuBtn: {
    display: 'block',
    color: 'white',
    'text-align': 'center'
  }
}

export default RecipeImageMarker;
