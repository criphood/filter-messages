import { Message, Filter, CleanFilter, Result } from './types';

export const filterMessages = (messages: Message[], filters: Filter) => {
  const filterBySet = (
    message: Message,
    { field, type, operation, value }: CleanFilter
  ) => {
    return Object.entries(message).filter(([messageKey, messageValue]) => {
      if (type === 'date' && messageKey === field) {
        const filterDate = new Date(value).getTime();
        const messageDate = new Date(messageValue as string).getTime();

        if (operation === 'eq') return filterDate === messageDate;
        if (operation === 'before') return filterDate > messageDate;
        if (operation === 'after') return filterDate < messageDate;
      }

      if (typeof messageValue === 'string' && messageKey === field) {
        if (operation === 'eq') return messageValue === value;
        if (operation === 'startsWith') return messageValue.startsWith(value);
        if (operation === 'endsWith') return messageValue.endsWith(value);
        if (operation === 'contains') return messageValue.includes(value);
      }

      if (typeof messageValue === 'number' && messageKey === field) {
        if (operation === 'eq') return messageValue === value;
        if (operation === 'gt') return messageValue > value;
        if (operation === 'lt') return messageValue < value;
        if (operation === 'gte') return messageValue >= value;
        if (operation === 'lte') return messageValue <= value;
      }

      if (
        typeof messageValue === 'boolean' &&
        messageKey === field &&
        operation === 'eq'
      )
        return messageValue === value;
    });
  };

  return messages.filter((message) => {
    let result: Result = [];

    const combineFilters = (setOfFilters: Filter) => {
      if (setOfFilters.type === 'and') {
        messages.map((message) => {
          setOfFilters.filters.map((filter: Filter) =>
            filterBySet(message, filter as CleanFilter).map((item) =>
              result.push(JSON.stringify(item))
            )
          );
        });

        result = result.filter((item, i) => {
          return i !== result.indexOf(item);
        });

        result = result.map((item) => {
          return JSON.parse(<string>item);
        });
      } else if (setOfFilters.type === 'or') {
        setOfFilters.filters.map((filter: Filter) =>
          filterBySet(message, filter as CleanFilter).map((item) =>
            result.push(item)
          )
        );
      } else {
        filterBySet(message, setOfFilters).map((item) => result.push(item));
      }
    };

    combineFilters(filters);

    return Object.values(message)[0] === result.flat()[1];
  });
};

