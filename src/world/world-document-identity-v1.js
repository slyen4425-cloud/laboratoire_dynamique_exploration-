// The ONE WorldDocument identity syntax used by the official archive and
// by session-scoped Aventure handoffs. World names may contain spaces,
// accents and punctuation. Never derive/rename user-authored world IDs.
export function assertExplorationWorldDocumentIdV1(value){
 if(typeof value!=='string'||!value.trim()||value.length>130||
    /[\u0000-\u001f\u007f]/.test(value))
  throw new TypeError('Identifiant de WorldDocument officiel invalide');
 return value;
}
