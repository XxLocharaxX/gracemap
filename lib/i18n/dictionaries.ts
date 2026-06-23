export type Language = 'ru' | 'en';

export const dictionaries = {
  ru: {
    filters: {
      all: 'Все',
      urgent: 'Срочно',
      project: 'Церкви',
      prayer: 'Молитва',
    },
    bottomSheet: {
      urgent: 'Срочная помощь',
      project: 'Церковь / Община',
      prayer: 'Молитва',
      request: 'Запрос',
      distance: 'км от вас',
      published: 'Опубликовано',
      verified: 'Верифицировано церковью',
      btnHelp: 'Помочь',
      btnContact: 'Написать / позвонить',
      btnPray: 'Молиться за них',
    },
    map: {
      loading: 'Загрузка карты мира...',
    },
    addRequest: {
      title: 'Добавить запрос',
      step1: 'Что нужно?',
      step2: 'Описание',
      step3: 'Локация',
      typeUrgent: 'Мне нужна помощь',
      typeProject: 'Нашей церкви/общине',
      typePrayer: 'Прошу молитвы',
      formTitle: 'Заголовок',
      formTitlePlaceholder: 'Опишите кратко суть',
      formDesc: 'Описание',
      formDescPlaceholder: 'Подробности вашей ситуации...',
      btnNext: 'Далее',
      btnBack: 'Назад',
      btnPublish: 'Опубликовать',
      selectLocation: 'Перетащите маркер на точное место',
      fetchingAddress: 'Определяем адрес...',
    },
    validation: {
      titleMin: 'Заголовок должен содержать минимум 10 символов',
      titleMax: 'Заголовок не должен превышать 80 символов',
      descMin: 'Описание должно содержать минимум 30 символов',
      typeRequired: 'Выберите тип запроса',
    }
  },
  en: {
    filters: {
      all: 'All',
      urgent: 'Urgent',
      project: 'Churches',
      prayer: 'Prayer',
    },
    bottomSheet: {
      urgent: 'URGENT HELP',
      project: 'CHURCH / COMMUNITY',
      prayer: 'PRAYER',
      request: 'REQUEST',
      distance: 'km away',
      published: 'Published',
      verified: 'Church verified',
      btnHelp: 'Help',
      btnContact: 'Message / Call',
      btnPray: 'Pray for them',
    },
    map: {
      loading: 'Loading world map...',
    },
    addRequest: {
      title: 'Add Request',
      step1: 'What is needed?',
      step2: 'Description',
      step3: 'Location',
      typeUrgent: 'I need help',
      typeProject: 'For our church/community',
      typePrayer: 'I need prayer',
      formTitle: 'Title',
      formTitlePlaceholder: 'Briefly describe the need',
      formDesc: 'Description',
      formDescPlaceholder: 'Details of your situation...',
      btnNext: 'Next',
      btnBack: 'Back',
      btnPublish: 'Publish',
      selectLocation: 'Drag the marker to the exact location',
      fetchingAddress: 'Fetching address...',
    },
    validation: {
      titleMin: 'Title must be at least 10 characters',
      titleMax: 'Title must not exceed 80 characters',
      descMin: 'Description must be at least 30 characters',
      typeRequired: 'Please select a request type',
    }
  }
};
