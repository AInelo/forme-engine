# DEUXIEME VAGUE DE FONCTIONNALITE

1. Mettre enplace l'option dans le FormeEngine 
d'affichage de tout les formField d'une section
une pagination faite par Section 
on en aura toujour 02 par ligne sur les tablet a 4k screen et
01 par ligne en mobile vision 
Donc on ajouetera a l'interface FormField un props pour dire 
si il sera en full width ou en 1/2 car comme on l'a dit on 
doit le faire en deux type sur les ecran large 


2. Creer un OTPFormField qui reste exclusivement seule dans une 
section en Modal sur tout et contient des champs de OTP 
par defaut 06 case de OTP
donc cette FormField doit pouvoir avoir en props les infos qu'il faut pour send le OTP. Maintenant l'evolution du formulaire doit dependre du retour de serveur 


si le serveur envoi un success, on continue sur le formulaire
si le serveur retourne un call_back_url, on affiche en dessous des case de OTP le lien en disant continuer sur et quand on clique sur ce continuer sur cela redirige et vide tout du Formulaire

aussi pour la Navugation que l'on soit bySection ou byField,
arrvier sur cette section on affiche lui solo sur la page (une exeption pour le byField)

C'est vraiment un Field Important et singuliere. Permet une etape de prevalidation (action avec un serveur par POST) au sein du formulaire

en cas de continuation il doit etre applati et mis dans le JSON 
du FormEngine a la fin 
le FormField OTP contenu dans une section etant seul doit etre liee a une autre FormField dans tout le form-engine qui precede cette section de type Email par Favoris. Et ce FormField auquel il est lie doit faire forcement un process d'appel API. Comme quand on envoie par un process API la valeur de son contenu pour une authentification 


3. pour les fieldType dropdown checkbox radio il y a souvent l'option "autre" ou ecrit comme ceci "autres"

je voudrais automatiser l'acquisition de la valeur de ce autres sans qu'on ne cache un Field qu'on affichera avec conditionDisplay car 
donc pour ces types de field quand la valeur choisi est autre ou contient au moins autres (cas des checkbox multichoix )
on genere automatiquement un field de type text qui aura pour fieldName "autre_nom_du_field_en_rapport"
et bien evident il apparait dans l'objet final rendu par le formEngine 





4. Comme les RepeatGroup de la 1ere generation et de la seconde generation, nous voulons Mettre en place 
un GetDetailInfos qui sera appliquer a tout les champs de type "checkbox" "radio" "dropdown" 
l'idee c'est de pouvoir receuillir des detaill (qui peuvent etre representer par plusieurs champs) des choix fait dans un FormField unichoix ou multichoix
pour le unichoix on genere cet ensemble de champs qui nous permet d'avoir de detail cet element choisi 
pour le multichoix on genee cet ensemble de champs qui nous permet d'avoit de detaill sur chacun de ces elements choisi (cas du checkbox)
on veut automatiser ce process