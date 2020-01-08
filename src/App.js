import { Component } from 'inferno';
import Dropzone from './components/Dropzone';
import RecipeImageMarker from './components/RecipeImageMarker';
import { createId } from './lib/createId';

const RecipeStepSkeleton = () => ({
  text: 'Just a step',
  id: createId(),
  title: '',
});

const RecipeIngredientSkeleton = {
  id: createId(),
  unit: 'kg',
  amount: '0.5',
  name: 'Tomatoes'
};

const RecipeSkeleton = {
  id: createId(),
  title: '',
  ingredients: [],
  steps: []
}

class App extends Component {
  state = {
    recipe_title: '',
    recipeParts: [{
      ...RecipeSkeleton
    }], 
    // contains 1 or more recipes (most of the time just one as one recipe contains one description but sometimes there is additional for sauce etc.)
    /**
     * One Recipe then looks like this
     */
    image: {
      showEditor: false
    }
  }

  onFileDropped(fileHandle) {
    const files = fileHandle.files;
    if (files.length > 1) {
      alert('Cannot process multiple images at the same time, sorry');
      return;
    }

    const file = fileHandle.files[0];

    const isImageType = /^image.*/.test(file.type);

    if (!isImageType) {
      alert('Please drop an image');
      return;
    }

    const _this = this;
    const fileReader = new FileReader();
    fileReader.onload = readingResult => {
      const img = new Image();
      img.onload = function() {
        const { width, height } = this;
 
        _this.setState(prevState => {
          return {
            ...prevState,
            image: {
              id: createId(),
              imageRef: img,
              showEditor: true,
              originalWidth: width,
              originalHeight: height,
            }
          }
        })
      }
      img.src = readingResult.target.result;
      
    };

    fileReader.readAsDataURL(file);
  }

  onClickCloseEditor() {
    this.setState(state => {
      const image = state.image;

      return {
        ...state,
        image: {
          ...image,
          showEditor: false,
        }
      }
    });
  }

  updateInputValue(recipePartId, ingredientId, ingredientProperty, keyEvent) {
    this.setState(prevState => {
      const newRecipeParts = prevState.recipeParts.map( recipePart => {
        if (recipePart.id !== recipePartId) {
          return recipePart;
        } 

        const theIngredients = recipePart.ingredients.map( ingredientObj => {
          if (ingredientObj.id !== ingredientId) {
            return ingredientObj;
          }

          return {
            ...ingredientObj,
            [ingredientProperty]: keyEvent.target.value,
          }
        });

        return {
          ...recipePart,
          ingredients: theIngredients,
        }
      });

      return {
        ...prevState,
        recipeParts: newRecipeParts,
      }
    })
  }

  updateRecipeTitle(e) {
    e.preventDefault();

    this.setState(prevState => {
      return {
        ...prevState,
        recipe_title: e.target.value,
      }
    })
  }

  updateRecipePartTitle(recipePartId, e) {
    e.preventDefault();

    this.setState(prevState => {
      const recipeParts = prevState.recipeParts.map( recipePart => {
        if (recipePart.id === recipePartId) {
          return {
            ...recipePart,
            title: e.target.value,
          }
        } else {
          return recipePart;
        }
      });

      return {
        ...prevState,
        recipeParts,
      }
    })
  }

  render() {
    return (
      <Dropzone onDrop={(fileHandle) => this.onFileDropped(fileHandle)}>
        { this.state.image.showEditor &&
          <RecipeImageMarker 
            imageData={this.state.image} 
            onImageAnalysisDone={(arr, imageCut) => this.onImageAnalysisDone(arr, imageCut)}
            onClickClose={e => this.onClickCloseEditor()} />}
        
        <form>
          <fieldset>
            <div className="inputbox">
              <input 
                onInput={e => this.updateRecipeTitle(e)}
                placeholder='Main Title of the recipe' 
                type="text" 
                name="recipe_title" />
            </div>


            {this.state.recipeParts.map( ( recipeWithStepsAndIngredients ) => {
              const { id, ingredients, steps, title } = recipeWithStepsAndIngredients;
              const recipePartId = id;

              return (
                <div key={id} className="recipe-part">
                  <input 
                    placeholder='Title of part of the recipe (e.g. "Meat preparation")' 
                    type="text" 
                    name="recipe_title" 
                    value={ title }
                    onInput={e => this.updateRecipePartTitle(recipePartId, e)} 
                  />
                  <small style={{
                    display: 'block',
                    'margin-top': '-1.5ex'
                  }}>
                    leave empty if the recipe only contains one part!
                  </small>
                  <div className="ingredients-box">
                    { ingredients.map(({ unit, amount, name, id: ingredientId }) => {
                      return (
                        <div className="ingredient-entry">
                          <input 
                            type="text"
                            value={amount} 
                            onInput={e => this.updateInputValue(recipePartId, ingredientId, 'amount', e)} 
                            style={{ 'max-width': '80px' }} />
                          <input 
                            type="text"
                            value={unit}
                            onInput={e => this.updateInputValue(recipePartId, ingredientId, 'unit', e)}
                            style={{ 'max-width': '80px' }} />
                          <input 
                            type="text"
                            value={name}
                            onInput={e => this.updateInputValue(recipePartId, ingredientId, 'name', e)} />
                          <button type="button" style={{ 'flex-shrink': '10' }} onClick={e => this.removeIngredient(recipePartId, ingredientId)}>x</button>
                        </div>
                      )
                    }) }

                    <div>
                      <button type="button" onClick={e => this.onAddIngredient(id)}>+ Ingredient</button>
                    </div>
                  </div>

                  <div className="recipesteps-box">
                    { steps.map(({ text }) => {
                      return (
                        <div className="recipestep-entry">
                          <textarea value={text} style={{ height: '120px' }}></textarea>
                        </div>
                      )
                    }) }

                    <div>
                      <button type="button" onClick={e => this.onAddStep(id)}>+ Step</button> &nbsp; &nbsp;
                      { steps.length > 0 && <button type="button" onClick={e => this.removeLastStep(id)}>Remove last step</button>}
                    </div>
                  </div>
                </div>
              )
            })}

            <div>
              <button type="button" onClick={ (e) => this.addRecipePart(e) }>+ Recipe-Part</button>
            </div>
            
          </fieldset>
          <div style={style.ctaBtnHolder}>
            <button onClick={e => this.saveNow(e)} type="button">save</button>
          </div>
        </form>
      </Dropzone>
    );
  }

  removeIngredient(recipePartId, ingredientId) {
    this.setState(prevState => {
      const recipePartsNew = prevState.recipeParts.map( recipeWithStepsAndIngredients => {
        const { ingredients, id: _recipePartId } = recipeWithStepsAndIngredients;

        if (_recipePartId !== recipePartId) {
          return recipeWithStepsAndIngredients;
        }

        const newIngredients = ingredients.filter(({ id: _ingredientId }) => ingredientId !== _ingredientId);

        return {
          ...recipeWithStepsAndIngredients,
          ingredients: newIngredients
        };
      });

      return {
        ...prevState,
        recipeParts: recipePartsNew
      }
    });
  }

  removeLastStep(recipePartId) {
    this.setState(prevState => {
      const newRecipeParts = prevState.recipeParts.map( recipeWithStepsAndIngredients => {
        const { steps, id } = recipeWithStepsAndIngredients;

        if (id !== recipePartId) {
          return recipeWithStepsAndIngredients;
        }

        steps.pop();

        return {
          ...recipeWithStepsAndIngredients,
          steps: [ ...steps ]
        }
      });

      return {
        ...prevState,
        recipeParts: [
          ...newRecipeParts
        ]
      }
    })
  }

  onAddStep(recipePartId) {
    this.setState(prevState => {
      const newRecipePart = prevState.recipeParts.map( recipeWithStepsAndIngredients => {
        const { steps, id } = recipeWithStepsAndIngredients;

        if (id !== recipePartId) {
          return recipeWithStepsAndIngredients;
        }

        const newSteps = 
          [ ...steps ]
          .concat( [ RecipeStepSkeleton() ]);

        return {
          ...recipeWithStepsAndIngredients,
          steps: newSteps
        }
      });

      return {
        ...prevState,
        recipeParts: [
          ...newRecipePart
        ]
      }
    })
  }

  onAddIngredient(recipePartId) {
    this.setState(prevState => {
      const newRecipePart = prevState.recipeParts.map( recipeWithStepsAndIngredients => {
        const { ingredients, id } = recipeWithStepsAndIngredients;

        if (id !== recipePartId) {
          return recipeWithStepsAndIngredients;
        }

        const newIngredients = 
          [ ...ingredients ]
          .concat( [ { ...RecipeIngredientSkeleton, id: createId() } ]);

        return {
          ...recipeWithStepsAndIngredients,
          ingredients: newIngredients
        }
      });

      return {
        ...prevState,
        recipeParts: [
          ...newRecipePart
        ]
      }
    })
  }

  addRecipePart(e) {
    e.preventDefault();
    const id = createId();

    this.setState(prevState => {
      return {
        ...prevState,
        recipeParts: []
          .concat(prevState.recipeParts)
          .concat([{ 
            ...RecipeSkeleton,
            id
           }])
      }
    })
  }

  onImageAnalysisDone(groupsCollected, imageCutObj) {
    this.setState(prevState => {
      const image = prevState.image;

      const newImageObj = !image ? image : {
        ...image,
        showEditor: false,
      };

      return {
        ...prevState,
        recipeParts: groupsCollected.map(group => {
          return {
            ...group,
            title: group.title ? group.title : '',
          }
        }),
        image: newImageObj,
        previewImage: imageCutObj,
      }
    });
  }

  saveNow(event) {
    event.preventDefault();

    const { recipe_title } = this.state;

    if (!recipe_title) {
      alert('please provide a recipe title');
    } else {
      const processedData = this.processForDatabase();

      console.log('processedData', processedData);
    }
  }

  processForDatabase() {
    const { recipe_title, recipeParts } = this.state;

    console.log('state', this.state);

    let recipeObj = {
      title: recipe_title,
      previewImage: (this.state.previewImage) ? {
        dataURL: this.state.previewImage.dataURL
      } : false,
      groups: recipeParts.map( groupObj => {
        let group = {};
        if (groupObj.ingredients.length > 0) {
          group.ingredients = groupObj.ingredients;
        }

        if (groupObj.steps.length > 0) {
          group.steps = groupObj.steps;
        }

        if (groupObj.title) {
          group.title = groupObj.title;
        }

        return group;
      }),
    };
    
    return recipeObj;
  }
}


const style = {
  ctaBtnHolder: {
    position: 'fixed',
    top: '1ex',
    left: '1ex',
    padding: '1ex',
    background: 'rgba(255, 255, 255, 0.7)',
  }
}

export default App;
