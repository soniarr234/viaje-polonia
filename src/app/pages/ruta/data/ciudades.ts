import { Ciudad } from '../models/ciudad.model';

export const CIUDADES: Ciudad[] = [
  {
    nombre: 'Wrocław',
    pais: 'Polonia',

    descripcion:
      'Ciudad famosa por sus enanos, sus puentes y uno de los cascos históricos más bonitos de Polonia.',

    lugares: [
      {
        nombre: 'Rynek',
        direccion: 'Rynek, Wrocław',
        imagen:
          'https://images.unsplash.com/photo-1519677100203-a0e668c92439',
        descripcion:
          'La Plaza del Mercado es el corazón de Wrocław y una de las plazas medievales más grandes de Europa.',
        maps: 'https://maps.google.com'
      },

      {
        nombre: 'Catedral de San Juan Bautista',
        direccion: 'plac Katedralny 18',
        imagen:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        descripcion:
          'Impresionante catedral gótica situada en la isla de Ostrów Tumski.',
        maps: 'https://maps.google.com'
      },

      {
        nombre: 'Universidad de Wrocław',
        direccion: 'plac Uniwersytecki 1',
        imagen:
          'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a',
        descripcion:
          'Famosa por su Aula Leopoldina, una joya del barroco.',
      }
    ],

    restaurantes: [
      {
        nombre: 'Konspira',
        direccion: 'Plac Solny 11',
        imagen:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        descripcion:
          'Comida polaca tradicional.'
      },

      {
        nombre: 'Bernard',
        direccion: 'Rynek 35',
        imagen:
          'https://images.unsplash.com/photo-1552566626-52f8b828add9',
        descripcion:
          'Restaurante muy popular junto a la plaza principal.'
      }
    ],

    cafeterias: [
      {
        nombre: 'Charlotte',
        direccion: 'ul. Świdnicka',
        imagen:
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
        descripcion:
          'Perfecta para desayunar.'
      },

      {
        nombre: 'Central Café',
        direccion: 'Rynek',
        imagen:
          'https://images.unsplash.com/photo-1445116572660-236099ec97a0',
        descripcion:
          'Café moderno con vistas al centro.'
      }
    ],

    curiosidades: [
      'Hay más de 800 enanos repartidos por toda la ciudad.',
      'Fue Capital Europea de la Cultura en 2016.',
      'Tiene más de 100 puentes.'
    ]
  }
];