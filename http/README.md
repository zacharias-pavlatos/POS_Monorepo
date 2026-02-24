TODO:

General:
    - Having UUID as ID is a bit ocured and not human readable. Feel a bit too much.
    - Need find a way to setup the restaurant, when user is sign up it should create a restaurant for the user, workstation and a default catalog.
    - add pagination to all the endpoints that return a list of items.
    - all the aggregated field should be at top level of the response, not nested under a field.They should be flat.
    - Need a better error response structure.

At workstation :
    - Do we need {{workstationId}}/categories since we have {{workstationId}}/detailed?

At catalog :
    - Do we need those
        "availableFrom": null,
        "availableUntil": null,
        "activeDaysOfWeek": null,
        "internalNotes": null,
        "color": null,
        "image": null,
        "displayOrder": null,
    - Can a catalog set upon creation its categories?

At category :
    - It mentatory to have a catalogId why not null and that means the main
    - Its mentatory to have a workstationId. why not null and that means the main
    - Active from is not nullable there for in mentatory
    - Not sure if we need GET {{baseUrl}}{{apiPrefix}}/categories/{{categoryId}}/products endpoint
    - "Products should be at top level of category response, not nested under products[].product — flatten the junction table."

At product :
    - Workstation is mentatory. Thats wrong should be optional and that means the that follows the workstation of the category that is in.If you define a workstation for a product it will override the workstation of the category.
    - By having default value for basePrice we are NOT forcing the user to set a price. Therefore we should remove the default value and make it mentatory.

At modifier-group :
    - What if thre is no limit at the maxSelections? minSelections should be 0.
    maxSelections should be null or 0 ? Should we allow it?
    - list all modifier groups with modifiers and dependencies.Not just by a specific group_id.
    - List modifier groups for a product and the modifiers and dependencies. 

At modifier:
    - all ok

At modifiers-dependencies:
    - all ok

At offer:
    - 
