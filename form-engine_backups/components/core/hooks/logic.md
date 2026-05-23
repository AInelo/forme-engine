La methode validate est appliquer sur une section 
la section afficher a la page actuelle dans la navigation, une section peut etre sur plusieur page car une page contient normalement au plus 04 FormField. Cette logiques est deja defini dans un hooks 

la methode doit verifier si tout les formField sur la page actuelle sont valide aux regles de validation, si ils ont ete toucher, si quand ils sont required, il ont ete rempli 



handleNext ====depend de=== isValid touched et allRequiredFieldFilled 

handleSubmitWithValidation ====== depend de ==== isValid touched et allRequiredFieldFilled