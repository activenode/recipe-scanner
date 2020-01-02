import { Component } from 'inferno';
import { nextFrame } from '../lib/frame';
import { ocrByBase64Image } from '../lib/ocr';

var createId = function () {
  const t = +(new Date());
  return '_' + Math.random().toString(36).substr(2, 9) + '_' + t;
};

function openPreviewOfDataUrl(dataURL) {
  var image = new Image();
  image.src = dataURL;

  var w = window.open("");
  w.document.write(image.outerHTML);
}

const splitupParts = [
  {
    key: 'imagePartsIngredients',
    title: 'Ingredients',
  },
  {
    key: 'imagePartsDescriptionTexts',
    title: 'Description Texts',
  }
];

const Rx = {
  descOrIngredient: /^(i|d)(,[123456789])?$/,
  ingredient: /^i,[123456789]?$/,
  groupNumberMatcher: /^(?:i|d),([123456789])?$/,
}

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

  analysisHelperCanvasElement = null;

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
    imageSelections: [],
    showStep2_confirmImageCuts: false,
    isOcrStep: false,
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
    if (pointerDownEvent.target.classList.contains('remove') ||
    pointerDownEvent.target.nodeName.toLowerCase() === 'input') {
      // do not catch, just go on
      return;
    }
    
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
    this.moveExistingSelectionData.lastNewTop = newTop;

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

    if (!width || !height || width < 10 || height < 10) {
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

    this.currentDragSelectionDimensions = {};

    this.setState(prevState => {
      const existingSelections = prevState.imageSelections;

      return {
        ...prevState,
        imageSelections: [
          ...existingSelections,
          {
            id: createId(),
            ...percentageCssValues,
            inputValue: 'i,1',
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
    const relativeX = this.moveExistingSelectionData.lastNewLeft / widthToRelateTo;
    const relativeY = this.moveExistingSelectionData.lastNewTop / heightToRelateTo;

    this.setState(prevState => {
      const imageSelectionsNew = prevState.imageSelections.map( s => {
        if (s.id !== this.moveExistingSelectionData.selectionId) {
          return s;
        }

        return {
          ...s,
          left: `${relativeX * 100}%`,
          top: `${relativeY * 100}%`,
        };
      })

      return {
        ...prevState,
        imageSelections: [...imageSelectionsNew]
      }
    });

    // reset!
    this.moveExistingSelectionData = {
      ...MoveExistingSelectionDataSkeleton
    }
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

  removeSelection(e, id) {
    e.preventDefault();
    e.stopPropagation();

    this.setState(prevState => {
      const imageSelectionsNew = prevState.imageSelections.filter(s => {
        if (s.id !== id) {
          return true;
        }

        return false;
      });

      return {
        ...prevState,
        imageSelections: [ ...imageSelectionsNew ]
      }
    })
  }

  onChangeInputOnSelection(evt, selectionId) {
    evt.preventDefault();

    this.setState(prevState => {
      const imageSelectionsNew = prevState.imageSelections.map(s => {
        if (s.id !== selectionId) {
          return s;
        } else {
          return {
            ...s,
            inputValue: evt.target.value
          }
        }
      });
      
      return {
        ...prevState,
        imageSelections: imageSelectionsNew
      }
    });
  }

  goBackToSelectionStep() {
    this.setState(prevState => {
      return {
        ...prevState,
        showStep2_confirmImageCuts: false,
      }
    })
  }

  goToOcrStep() {
    this.setState(prevState => {
      return {
        ...prevState,
        isOcrStep: true,
      }
    });

    const ocrPromise = Promise.all(splitupParts.map( ({ key }) => {
      return new Promise( resolveAll => {
        const imageParts = this.state[key];

        Promise.all(imageParts.map( imagePart => {
          return ocrByBase64Image({
            isIngredient: imagePart.isIngredient,
            dataURL: imagePart.dataURL,
          }).then(jsonResult => {
            const ocrResult = jsonResult.ParsedResults && jsonResult.ParsedResults[0] ? jsonResult.ParsedResults[0] : 'N/A';
            return {
              ...imagePart,
              ocrResult,
            };
          })
        })).then( imagePartsWithOcrResults => {
          resolveAll({
            [key]: imagePartsWithOcrResults
          });
        });
      });
    }));

    ocrPromise.then(ocrTotalResult => {
      // we get an array of objects containing a key which points to the results.
      // we want to merge those to one object.

      return ocrTotalResult.reduce((acc, curr) => {
        return {
          ...acc,
          ...curr,
        }
      }, {});
    }).then( flattenedResult => {
      this.setState(prevState => {

        return {
          ...prevState,
        };
      })
    })
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
                const { left, top, width, height, id, inputValue } = selection;

                return (
                  <div style={{...(style.selection), left, top, width, height}}>
                    <div style={style.selectionDragger} 
                      onPointerDown={e => this.startDragExistingSelection(e, id)}></div>
                    <div className='remove' style={style.selectionRemover} 
                      onClick={e => this.removeSelection(e, id)}>x</div>
                    <input 
                      value={inputValue} 
                      type='text' 
                      style={style.miniInputBoxed}
                      onInput={e => this.onChangeInputOnSelection(e, id)} />
                  </div>
                )
              })}

              <div className="ghostbox" style={style.ghostBoxElement} ref={el => this.ghostBoxRefCallback(el)}></div>
            </div>
          </div>

          <div style={style.editorMenu}>
            <div role='button' 
              style={style.editorMenuBtn} 
              onClick={e => this.closeEditor()}>x</div>
            {this.state.imageSelections.length > 0 && <div role='button' 
              style={style.editorMenuBtn} 
              onClick={e => this.requestAnalysis()}>start analysis</div>}
          </div>
        </div>

        <div className='showStep2_confirmImageCuts' style={{
          ...(style.confirmImageCutsLayer),
          display: this.state.showStep2_confirmImageCuts ? 'block' : 'none'
        }}>
          <canvas hidden ref={elem => this.setAnalysisHelperCanvas(elem)}></canvas>

          {this.state.imagePartsRead && <div style={{ padding: '100px 3ex 3ex 3ex' }} className='list-imagecut-previews'>
            
            <div style={style.topBtnBar}>
              {!this.state.isOcrStep && <button
                onClick={e => this.goBackToSelectionStep(e)}
                style={{ border: '1px solid #333', background: '#9a0f61', 'cursor': 'pointer' }} type='button'>Go back</button>}
              {!this.state.isOcrStep && <button 
                onClick={e => this.goToOcrStep(e)}
                style={{ border: '1px solid #333', background: '#49a96c', 'cursor': 'pointer'}} type='button'>Confirm Selections</button>}
              {this.state.isOcrStep && <button 
                disabled={true}
                style={{ border: '1px solid #333', background: 'grey'}} type='button'>Processing...</button>}
            </div>
            
            {!this.state.isOcrStep && <h2 style={{ color: 'yellow', 'font-size': '28px', 'font-weight': 500, 'padding-top': '0' }}>
              Please make sure that your cuts are proper. If not, go back and adapt.
              <small style={{ 'display': 'block', 'font-size': '57%' }}>The sizes you see are just previews. These are not the actual cut sizes. Click on one to see the preview.</small>
            </h2>}

            {(() => {
              return splitupParts.map(({key, title}) => {
                return (
                  <div>
                    {this.state[key] && this.state[key].length > 0 && 
                      <h3 style={{ color: 'white', 'font-size': '21px', 'font-weight': 'bold' }}>{title}</h3>}
                    {this.state[key].map(imagePart => {
                      return (
                        <div style={{ display: 'flex', 'background': '#313131bd', padding: '2ex' }}>
                          <img 
                            alt=''
                            src={imagePart.dataURL} style={{ 
                              'max-width': '300px', 
                              'border': '2px solid red', 
                              cursor: 'pointer', 
                            }}
                            onClick={() => openPreviewOfDataUrl(imagePart.dataURL)} 
                          />
                          <div style={{ color: 'white', 'padding-left': '4ex' }}>
                            Group {imagePart.group}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            })()}
            
            
          </div>}
        </div>
      </div>
    );
  }

  setAnalysisHelperCanvas(elem) {
    this.analysisHelperCanvasElement = elem;
  }

  async readImagePart( selection, { originalHeight, originalWidth, imageRef } ) {
    return new Promise(res => {
      const widthInPixels = Math.round((parseFloat(selection.width) / 100) * originalWidth);
      const heightInPixels = Math.round((parseFloat(selection.height) / 100) * originalHeight);
      const topInPixels = (parseFloat(selection.top) / 100) * originalHeight;
      const leftInPixels = (parseFloat(selection.left) / 100) * originalWidth;

      const c = this.analysisHelperCanvasElement;
      const ctx = c.getContext('2d');
      c.setAttribute('width', widthInPixels);
      c.setAttribute('height', heightInPixels);

      nextFrame(() => {
        ctx.clearRect(0, 0, widthInPixels, heightInPixels);
        ctx.drawImage(imageRef, leftInPixels, topInPixels, widthInPixels, heightInPixels, 0, 0, widthInPixels, heightInPixels);

        res(c.toDataURL('image/jpeg', 0.8));
      });
    });
  }

  async splitUpImageIntoSelections({ imageSelections, originalHeight, originalWidth, imageRef }) {
    const imagePartsCollected = [];

    for (let i = 0; i < imageSelections.length; i++) {
      let { inputValue } = imageSelections[i];
      inputValue = (inputValue || '').trim();

      const dataURL = await this.readImagePart( imageSelections[i], { originalHeight, originalWidth, imageRef } );

      imagePartsCollected.push({
        id: imageSelections[i].id,
        dataURL, 
        inputValue,
      });
    }

    return imagePartsCollected;
  }

  checkIfSelectionsHaveValidInputs() {
    const rx = Rx.descOrIngredient;

    if (this.state.imageSelections.length === 0) {
      alert('You gotta make some selections on the image');
      return false;
    }

    let isValid = true;
    this.state.imageSelections.forEach(({ inputValue }) => {
      if (!(rx.test(inputValue))) {
        alert(`"${inputValue}" is not a valid value, it should match ${rx}`);
        isValid = false;
      }
    });

    return isValid;
  }

  requestAnalysis() {
    if (!this.checkIfSelectionsHaveValidInputs()) {
      return false;
    }

    const c = this.analysisHelperCanvasElement;

    this.setState(prevState => {
      return {
        ...prevState,
        showStep2_confirmImageCuts: true,
        imagePartsRead: null,
      }
    });

    const { originalHeight, originalWidth, imageRef } = this.props.imageData;
    this.splitUpImageIntoSelections({
      imageSelections: this.state.imageSelections,
      originalHeight,
      originalWidth,
      imageRef,
    }).then(imagePartsRead => {
      // before we pull em in the state we want to order them by ingredient/steps
      // and then each of them by their group number

      const _imagePartsRead = imagePartsRead.map( imagePart => {
        const matched = imagePart.inputValue.match(Rx.groupNumberMatcher);
        let group = matched ? matched[1] : 0;
        const isIngredient = Rx.ingredient.test(imagePart.inputValue);;

        return {
          ...imagePart,
          group,
          isIngredient,
        }
      });

      const imagePartsIngredients = _imagePartsRead.filter(({ inputValue }) => {
        return Rx.ingredient.test(inputValue);
      }).sort((a, b) => {
        if (a.group < b.group) {
          return -1;
        }

        if (a.group > b.group) {
          return 1;
        }

        return 0;
      });

      const imagePartsDescriptionTexts = _imagePartsRead.filter(({ inputValue }) => {
        return !Rx.ingredient.test(inputValue);
      }).sort((a, b) => {
        if (a.group < b.group) {
          return -1;
        }

        if (a.group > b.group) {
          return 1;
        }

        return 0;
      });

      this.setState(prevState => {
        return {
          ...prevState,
          imagePartsRead: true,
          imagePartsIngredients,
          imagePartsDescriptionTexts,
        }
      });
    })
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
    width: '70px',
    position: 'fixed',
    top: '4ex',
    right: '10px',
    display: 'flex',
    'border-radius': '5px',
    'flex-direction': 'column',
  },
  editorMenuBtn: {
    cursor: 'pointer',
    background: 'rgba(0,0,0,0.8)',
    'border-radius': '5px',
    padding: '1ex',
    display: 'block',
    color: 'white',
    'text-align': 'center',
    'margin-bottom': '2ex',
    'line-height': '13px',
    'font-size': '12px'
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
  },
  selectionRemover: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '14px',
    height: '14px',
    cursor: 'pointer',
    background: 'black',
    color: 'white',
    'font-size': '11px',
    'line-height': '12px',
    'text-align': 'center',
    'border-radius': '6px',
    'opacity': '0.8',
    'border': '1px solid black'
  },
  miniInputBoxed: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    margin: 0,
    padding: '0.3ex',
    'font-size': '11px',
    'font-weight': 'bold',
    'max-width': '50px',
    'border': '0',
    'outline': 'none',
  },
  confirmImageCutsLayer: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    'z-index': '22',
    background: 'rgba(0,0,0,0.9)',
    'overflow-y': 'scroll',
  },
  topBtnBar: {
    display: 'flex', 
    'justify-content': 'space-between',
    background: 'black',
    'border-bottom': '1px solid grey',
    position: 'fixed',
    top: '0',
    left: 0,
    width: '100%',
    padding: '1.5ex 3ex',
  }
}

style.selection = {
  ...(style.ghostBoxElement),
  'border-style': 'dashed',
  'display': 'block',
  'box-shadow': '1px 1px 3px rgba(0,0,0,0.2)',
};


export default RecipeImageMarker;
