import { Component } from 'inferno';

var createId = function () {
  const t = +(new Date());
  return '_' + Math.random().toString(36).substr(2, 9) + '_' + t;
};

const MoveExistingSelectionDataSkeleton = {
  active: false,
  selectionId: null,
  draggedElement: null,
  dragStartX: 0,
  dragStartY: 0,
  currentDragX: 0,
  currentDragY: 0,
  draggedElementOriginalX: 0,
  draggedElementOriginalY: 0,
  draggedElementOriginalWidth: 0,
  draggedElementOriginalHeight: 0,
  lastNewLeft: 0,
  lastNewTop: 0,
}

class RecipeImageMarker extends Component {
  canvasElement = null;
  currentScaleFactor = 1;
  selectionCreationPointerActive = false;

  lastImageId = null;

  dragStartX = 0;
  dragStartY = 0;
  currentDragX = 0;
  currentDragY = 0;
  imageSelectionsBoxX = 0;
  imageSelectionsBoxY = 0;
  imageSelectionsBoxWidth = 0;
  imageSelectionsBoxHeight = 0;
  currentDragSelectionDimensions = {};

  moveExistingSelectionData = {
    ...MoveExistingSelectionDataSkeleton
  }

  state = {
    imageSelections: []
  }

  closeEditor() {
    this.props.onClickClose();
  }

  onUpdate() {
    if (this.canvasElement) {
      this.lastImageId = this.props.imageData.id;
      
      requestAnimationFrame(() => {
        const ctx = this.canvasElement.getContext('2d');
        const { width, height } = this.canvasElement.getBoundingClientRect();
        const img = this.props.imageData.imageRef;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      })
    }
  }
  
  onSizeUpdate() {
    const { originalWidth, originalHeight } = this.props.imageData;
    const { width: canvasWidth, left, top } = this.canvasElement.getBoundingClientRect();
    let drawWidth,
      drawHeight;

    this.imageSelectionsBoxX = left;
    this.imageSelectionsBoxY = top;

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

    this.imageSelectionsBoxWidth = drawWidth;
    this.imageSelectionsBoxHeight = drawHeight;
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

  ghostBoxRefCallback(ghostBoxElement) {
    if (ghostBoxElement) {
      this.ghostBoxElement = ghostBoxElement;
    }
  }

  startDragExistingSelection(pointerDownEvent, selectionId) {
    pointerDownEvent.preventDefault();
    pointerDownEvent.stopPropagation();

    const { clientX, clientY } =  pointerDownEvent;

    if (clientY < this.imageSelectionsBoxY || clientX < this.imageSelectionsBoxX) {
      // should never happen but well its covered
      return;
    }

    this.moveExistingSelectionData.selectionId = selectionId;
    this.moveExistingSelectionData.active = true;
    this.moveExistingSelectionData.dragStartX = clientX;
    this.moveExistingSelectionData.dragStartY = clientY;
    this.moveExistingSelectionData.draggedElement = pointerDownEvent.target.parentNode;
    const { left, top, width, height } = this.moveExistingSelectionData.draggedElement.getBoundingClientRect();

    const relativeLeft = left - this.imageSelectionsBoxX;
    const relativeTop = top - this.imageSelectionsBoxY;

    this.moveExistingSelectionData.draggedElementOriginalX = relativeLeft;
    this.moveExistingSelectionData.draggedElementOriginalY = relativeTop;
    this.moveExistingSelectionData.draggedElementOriginalX = relativeLeft;
    this.moveExistingSelectionData.draggedElementOriginalY = relativeTop;
    this.moveExistingSelectionData.draggedElementOriginalWidth = width;
    this.moveExistingSelectionData.draggedElementOriginalHeight = height;
  }

  startCreateSelection(pointerDownEvent) {
    if (this.selectionCreationPointerActive || this.moveExistingSelectionData.active) {
      return false;
    }
    pointerDownEvent.preventDefault();
    const { clientX, clientY } =  pointerDownEvent;

    if (clientY < this.imageSelectionsBoxY || clientX < this.imageSelectionsBoxX) {
      // should never happen but well its covered
      return;
    }

    this.selectionCreationPointerActive = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;

    const relativeX = clientX - this.imageSelectionsBoxX;
    const relativeY = clientY - this.imageSelectionsBoxY;

    this.ghostBoxElement.style.display = 'block';
    this.ghostBoxElement.style.left = `${relativeX}px`;
    this.ghostBoxElement.style.top = `${relativeY}px`;
  }

  dragNewSelectionCreation(moveEvent) {
    moveEvent.preventDefault();

    const { clientX, clientY } =  moveEvent;
    this.currentDragX = clientX;
    this.currentDragY = clientY;

    const relativeX_ofPointerPosition = clientX - this.imageSelectionsBoxX;
    const relativeY_ofPointerPosition = clientY - this.imageSelectionsBoxY;

    const relativeX_ofStartingPosition = this.dragStartX - this.imageSelectionsBoxX;
    const relativeY_ofStartingPosition = this.dragStartY - this.imageSelectionsBoxY;

    const 
      width = Math.abs(relativeX_ofPointerPosition - relativeX_ofStartingPosition),
      height = Math.abs(relativeY_ofPointerPosition - relativeY_ofStartingPosition),
      left = Math.min(relativeX_ofStartingPosition, relativeX_ofPointerPosition),
      top = Math.min(relativeY_ofStartingPosition, relativeY_ofPointerPosition);

    this.currentDragSelectionDimensions = {
      width,
      height,
      left,
      top,
    };

    this.ghostBoxElement.style.top = `${top}px`;
    this.ghostBoxElement.style.left = `${left}px`;
    this.ghostBoxElement.style.width = `${width}px`;
    this.ghostBoxElement.style.height = `${height}px`;
  }

  dragExistingSelection(moveEvent) {
    moveEvent.preventDefault();

    const { clientX, clientY } =  moveEvent;

    const movedDistanceX = clientX - this.moveExistingSelectionData.dragStartX;
    const movedDistanceY = clientY - this.moveExistingSelectionData.dragStartY;

    let newLeft = this.moveExistingSelectionData.draggedElementOriginalX + movedDistanceX;
    let newTop = this.moveExistingSelectionData.draggedElementOriginalY + movedDistanceY;

    const maxLeft = this.imageSelectionsBoxWidth - this.moveExistingSelectionData.draggedElementOriginalWidth;
    const maxTop = this.imageSelectionsBoxHeight - this.moveExistingSelectionData.draggedElementOriginalHeight;

    newLeft = Math.min(Math.max(0,newLeft), maxLeft);
    newTop = Math.min(Math.max(0, newTop), maxTop);

    this.moveExistingSelectionData.lastNewLeft = newLeft;
    this.moveExistingSelectionData.lastNewTop = newLeft;

    this.setState(prevState => {
      const imageSelectionsNew = prevState.imageSelections.map( s => {
        if (s.id !== this.moveExistingSelectionData.selectionId) {
          return s;
        }

        return {
          ...s,
          left: newLeft + 'px',
          top: newTop + 'px',
        }
      });
      return {
        ...prevState,
        imageSelections: imageSelectionsNew
      }
    });
  }

  dragSelection(moveEvent) {
    if (this.selectionCreationPointerActive) {
      this.dragNewSelectionCreation(moveEvent);
    } else if (this.moveExistingSelectionData.active) {
      this.dragExistingSelection(moveEvent);
    }
  }

  stopSelectionCreation(pointerUpEvent) {
    this.selectionCreationPointerActive = false;
    this.ghostBoxElement.style.display = 'none';
    this.ghostBoxElement.style.width = '0';
    this.ghostBoxElement.style.height = '0';

    this.dragStartX = 0;
    this.dragStartY = 0;
    this.currentDragX = 0;
    this.currentDragY = 0;

    const elementCatchingPointerEvents = pointerUpEvent.target;
    const { width: widthToRelateTo, height: heightToRelateTo } = elementCatchingPointerEvents.getBoundingClientRect();

    const {
      width,
      height,
      left,
      top,
    } = this.currentDragSelectionDimensions;

    if (!width || !height || width < 5 || height < 5) {
      // no valid selection
      return;
    }

    // we want to be able to process it percentagewise on the original image potentially
    // . for this we need relative data instead of pixel data.
    const relativeWidth = width / widthToRelateTo;
    const relativeHeight = height / heightToRelateTo;
    const relativeX = left / widthToRelateTo;
    const relativeY = top / heightToRelateTo;

    const percentageCssValues = {
      width: `${100 * relativeWidth}%`,
      height: `${100 * relativeHeight}%`,
      left: `${100 * relativeX}%`,
      top: `${100 * relativeY}%`,
    };

    this.setState(prevState => {
      const existingSelections = prevState.imageSelections;

      return {
        ...prevState,
        imageSelections: [
          ...existingSelections,
          {
            id: createId(),
            ...percentageCssValues,
          }
        ]
      }
    })
  }

  stopSelectionMove(pointerUpEvent) {
    if (!this.moveExistingSelectionData.active) {
      return;
    }


    const { width: widthToRelateTo, height: heightToRelateTo } = this.canvasElement.getBoundingClientRect();
    
    const _idOfSelection = this.moveExistingSelectionData.selectionId;
    const relativeX = this.moveExistingSelectionData.lastNewLeft / widthToRelateTo;
    const relativeY = this.moveExistingSelectionData.lastNewTop / heightToRelateTo;

    // reset!
    this.moveExistingSelectionData = {
      ...MoveExistingSelectionDataSkeleton
    }

    this.setState(prevState => {
      console.log('updating set state');
      const imageSelectionsNew = prevState.imageSelections.map( imageSelection => {
        return imageSelection;
      })

      return {
        ...prevState,
        imageSelections: [...imageSelectionsNew]
      }
    })
  }

  stopDragByPointerUp(pointerUpEvent) {
    if (!this.selectionCreationPointerActive && !this.moveExistingSelectionData.active) {
      return;
    }

    if (pointerUpEvent) {
      pointerUpEvent.preventDefault()
    }

    if (this.selectionCreationPointerActive) {
      this.stopSelectionCreation(pointerUpEvent);
    } else if (this.moveExistingSelectionData.active) {
      this.stopSelectionMove(pointerUpEvent);
    }
  }

  render() {
    return (
      <div>
        <div style={style.editorLayer}>
          <div style={style.imgEditorContainer}>
            <canvas 
              ref={el => this.canvasRefCallback(el)} style={{ width: '100%', border: '2px solid black' }}>

            </canvas>
            <div 
              style={{...(style.imageSelectionsBox)}} 
              onPointerDown={e => this.startCreateSelection(e)}
              onPointerUp={e => this.stopDragByPointerUp(e)}
              onPointerMove={e => this.dragSelection(e)}>
              {this.state.imageSelections.map( selection => {
                const { left, top, width, height, id } = selection;

                return (
                  <div style={{...(style.selection), left, top, width, height}}>
                    <div style={style.selectionDragger} 
                      onPointerDown={e => this.startDragExistingSelection(e, id)}></div>
                  </div>
                )
              })}

              <div className="ghostbox" style={style.ghostBoxElement} ref={el => this.ghostBoxRefCallback(el)}></div>
            </div>
          </div>

          <div style={style.editorMenu}>
            <a role='button' 
              style={style.editorMenuBtn} 
              onClick={e => this.closeEditor()}>x</a>
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
  },
  ghostBoxElement: {
    'box-sizing': 'border-box',
    'background': 'linear-gradient(to right, rgba(75, 108, 183, 0.3), rgba(24, 40, 72, 0.3))',
    'border': '2px solid red',
    'position': 'absolute',
    top: 0,
    left: 0,
    display: 'none',
  },
  selection: {

  },
  selectionDragger: {
    position: 'absolute',
    top: '-6px',
    left: '-6px',
    width: '12px',
    height: '12px',
    cursor: 'move',
    background: 'red',
    'border-radius': '6px',
    'opacity': '0.7',
    'border': '1px solid black'
  }
}

style.selection = {
  ...(style.ghostBoxElement),
  'border-style': 'dashed',
  'display': 'block',
  'box-shadow': '1px 1px 3px rgba(0,0,0,0.2)',
};



export default RecipeImageMarker;
