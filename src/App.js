import { Component } from 'inferno';
import Dropzone from './components/Dropzone';
import RecipeImageMarker from './components/RecipeImageMarker';

var ID = function () {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9);
};


const RecipeIngredientSkeleton = {
  unit: 'kg',
  amount: '0.5',
  name: 'Tomatoes'
};

const RecipeSkeleton = {
  id: '',
  title: '',
  ingredients: [{
    ...RecipeIngredientSkeleton
  }],
  steps: [{

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
                    { ingredients.map(({ unit, amount, name }) => {
                      return (
                        <div className="ingredient-entry">
                          <input type="text" value={amount} />
                          <input type="text" value={unit} />
                          <input type="text" value={name} />
                        </div>
                      )
                    }) }

                    <div>
                      <button type="button" onClick={e => this.onAddIngredient(id)}>+ Ingredient</button>
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

  onAddIngredient(recipePartId) {
    this.setState(prevState => {
      const newRecipePart = prevState.recipeParts.map( recipeWithStepsAndIngredients => {
        const { ingredients, id } = recipeWithStepsAndIngredients;

        if (id != recipePartId) {
          return recipeWithStepsAndIngredients;
        }

        const newIngredients = 
          [ ...ingredients ]
          .concat( [ { ...RecipeIngredientSkeleton } ]);

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
    const id = ID();

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
