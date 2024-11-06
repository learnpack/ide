---
tutorial: "https://www.youtube.com/watch?v=Edrf7rGWWlQ"
---


# `02` Select DOM Element

En este sitio web, tenemos 2 elementos: un `<h1>` con el **id** `#theTitle` y un párrafo con el **id** `#theParagraph`. Puedes seleccionar cualquiera de los objetos en el DOM con la función `querySelector`. 

Por ejemplo: si queremos seleccionar el elemento `<h1>`, podemos hacer lo siguiente:

```js
let aux = document.querySelector('#theTitle');
// La variable aux ahora contiene el elemento H1 del DOM dentro.
```

Ahora que tenemos nuestro elemento `h1` guardado en `aux`, podemos acceder a cualquiera de las propiedades de `h1`, por ejemplo, podemos recuperar la propiedad de estilo `font-size` (tamaño de fuente) de esta manera:

```js
let aux = document.querySelector('#theTitle');
console.log(aux.style.fontSize);
```

Aquí puedes [leer más al respecto](https://www.w3schools.com/jsref/prop_style_fontsize.asp)

## 📝 Instrucciones:

1. Muestra una alerta con la `id` de `h1`.

## 💡 Pista:

+ Aquí puedes leer más sobre la propiedad id de cualquier elemento DOM: http://www.w3schools.com/jsref/prop_html_id.asp
