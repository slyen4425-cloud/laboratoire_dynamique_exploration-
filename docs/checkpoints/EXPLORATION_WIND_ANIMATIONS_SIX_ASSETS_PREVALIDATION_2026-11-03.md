# PREVALIDATION — import des 6 animations visuelles 2,5D (03/11/2026)

- Branche : `work/exploration-six-wind-animations-assets-2026-11-03` ; base immuable initiale `main@b4288d82dea9d39e64b07f8ddc23f0d4bcb07a99`.
- Premier commit isolé : `c1de906db10cee1906240506e7a0c56c34d22650` ; workflow provisoire puis import confirmé au SHA `92292a8e91fe944b6295e1bb880039c6c362eea4`.
- Matérialisation GitHub Actions run [41716148784](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41716148784) : **completed/success** ; workflow à usage unique supprimé dans le commit généré.
- 6 ZIP sources déplacés octet pour octet ; 72 PNG RGBA 512×512 (12 × 6) et 6 WebP RGBA (1024×768, 4×3 cellules de 256px) présents sur la branche.
- Les six validations visuelles ont été formulées par l'utilisateur dans le fil créatif ; les archives « A_VALIDER » anciennes sont celles explicitement approuvées.
- Tests locaux : 6 ZIP CRC OK, SHA256 des 6 sources correspondants, 72 PNG extraits, six WebP générés par Pillow ; contrôles sur le dépôt : 6 ZIP, 72 PNG, 6 WebP.
- Critère restant : CI au SHA exact après commit du présent document, puis PR #349 ; ne pas confondre « assets présents » et « objets placables ».
- Aucune modification World Builder, Combat, GenSRPG, collision ou rendu. Ne pas appeler GREEN produit ni publier main avant passage des gates.
