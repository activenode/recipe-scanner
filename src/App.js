import { Component } from 'inferno';
import Dropzone from './components/Dropzone';
import RecipeImageMarker from './components/RecipeImageMarker';

var createId = function () {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9);
};

const RecipeStepSkeleton = {
  text: 'Just a step',
};

const RecipeIngredientSkeleton = {
  id: createId(),
  unit: 'kg',
  amount: '0.5',
  name: 'Tomatoes'
};

const RecipeSkeleton = {
  id: createId(),
  title: '',
  ingredients: [{
    ...RecipeIngredientSkeleton
  }],
  steps: [{
    ...RecipeStepSkeleton
  }]
}

class App extends Component {
  state = {
    showRecipeImageMarker: false,
    recipe_title: '',
    recipeParts: [{
      ...RecipeSkeleton
    }], 
    // contains 1 or more recipes (most of the time just one as one recipe contains one description but sometimes there is additional for sauce etc.)
    /**
     * One Recipe then looks like this
     */
  }

  render() {
    return (
      <Dropzone>
        { this.state.showRecipeImageMarker &&
          <RecipeImageMarker onImageAnalysisDone={this.onImageAnalysisDone} />}
        
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
                          <input type="text" value={amount} style={{ 'max-width': '80px' }} />
                          <input type="text" value={unit} style={{ 'max-width': '80px' }} />
                          <input type="text" value={name} />
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
                      <button type="button" onClick={e => this.onAddStep(id)}>+ Step</button>
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

  onAddStep(recipePartId) {
    const id = createId();

    this.setState(prevState => {
      const newRecipePart = prevState.recipeParts.map( recipeWithStepsAndIngredients => {
        const { steps, id } = recipeWithStepsAndIngredients;

        if (id != recipePartId) {
          return recipeWithStepsAndIngredients;
        }

        const newSteps = 
          [ ...steps ]
          .concat( [ { ...RecipeStepSkeleton, id } ]);

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
    const id = createId();

    this.setState(prevState => {
      const newRecipePart = prevState.recipeParts.map( recipeWithStepsAndIngredients => {
        const { ingredients, id } = recipeWithStepsAndIngredients;

        if (id != recipePartId) {
          return recipeWithStepsAndIngredients;
        }

        const newIngredients = 
          [ ...ingredients ]
          .concat( [ { ...RecipeIngredientSkeleton, id } ]);

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

  onImageAnalysisDone(e) {
    console.log('onImageAnalysisDone', e);
  }
}

export default App;
