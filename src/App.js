import { Component } from 'inferno';
import Dropzone from './components/Dropzone';
import RecipeImageMarker from './components/RecipeImageMarker';
import { createId } from './lib/createId';

const RecipeStepSkeleton = () => ({
  text: 'Just a step',
  id: createId(),
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
              <input placeholder='Main Title of the recipe' type="text" name="recipe_title" />
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
    console.log('args', arguments);
    this.setState(prevState => {
      const image = prevState.image;

      const newImageObj = !image ? image : {
        ...image,
        showEditor: false,
      };

      return {
        ...prevState,
        recipeParts: groupsCollected,
        image: newImageObj,
        imageCutObj,
      }
    })

    console.log('this.state', this.state);
  }

  processForDatabase() {
    const sampleRecipeObj = {
      ingredientBoxes: [{
        ingredients: [ /* ... */ ]
      }],
      descriptionBoxes: [{
        text: '',
        isGlobalDescription: true, 
        // isGlobalDescription = true means that this recipe description is valid across all ingredients
      }]
    }


  }
}

export default App;
