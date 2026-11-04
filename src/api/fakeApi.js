import { API_CONFIG, DATA_KEY } from "./settings.js";
import { initialDataSample } from "./initial-data-sample.js";
import { isValidItemId } from "../utils/itemId.js";

function fakeRequest(operation, options = {}) {
  const {
    minDelay = API_CONFIG.minDelay,
    maxDelay = API_CONFIG.maxDelay,
    errorChance = API_CONFIG.errorChance,
  } = options;

  return new Promise((resolve, reject) => {
    const delayMS =
      Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    setTimeout(() => {
      if (Math.random() < errorChance) {
        reject(new Error("Simulated server Error"));
        return;
      }

      try {
        resolve(operation());
      } catch (error) {
        reject(error);
      }
    }, delayMS);
  });
}

function initializeDatabase() {
  if (!localStorage.getItem(DATA_KEY)) {
    localStorage.setItem(DATA_KEY, JSON.stringify(initialDataSample));
  }
}

function readData() {
  return JSON.parse(localStorage.getItem(DATA_KEY) || "[]");
}

function writeData(items) {
  localStorage.setItem(DATA_KEY, JSON.stringify(items));
}

initializeDatabase();

function filterItems(items, params) {
  const search = params.get("search");
  // search by name and description
  if (search) {
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()),
    );
  }
  // Apply filters before counting and paginating. Older records use the same
  // defaults as the editor and cards when extended fields are absent.
  const defaults = { category: "General", status: "Planned", priority: "Normal" };
  for (const field of ["category", "status", "priority"]) {
    const value = params.get(field);
    if (value) items = items.filter((item) => (item[field] ?? defaults[field]) === value);
  }
  return items;
}

export async function getItemsList(query = "") {
  return fakeRequest(() => {
    const params = new URLSearchParams(query);
    const sort = params.get("sort") || "name";
    const requestedPage = Number(params.get("page"));
    const requestedLimit = Number(params.get("limit"));
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : 10;
    let items = filterItems(readData(), params);

    // SORT by name
    items = [...items].sort((a, b) => {
      switch (sort) {
        case "name-desc":
          return b.name.localeCompare(a.name);

        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    // PAGINATION
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    const data = items.slice(start, start + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  });
}

export async function getDashboard(query = "") {
  return fakeRequest(() => {
    const items = filterItems(readData(), new URLSearchParams(query));
    const total = items.length;
    const completed = items.filter((item) => item.status === "Completed").length;

    function breakdown(field, fallback) {
      const counts = new Map();
      for (const item of items) {
        const name = item[field] ?? fallback;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      return [...counts].map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }

    return {
      statistics: {
        total,
        completed,
        inProgress: items.filter((item) => item.status === "In progress").length,
        highPriority: items.filter((item) => ["High", "Urgent"].includes(item.priority)).length,
        completionRate: total ? Math.round(completed / total * 100) : 0,
      },
      breakdowns: {
        category: breakdown("category", "General"),
        status: breakdown("status", "Planned"),
      },
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 5),
    };
  });
}

export async function getItem(id) {
  return fakeRequest(() => {
    if (!isValidItemId(id)) {
      const error = new Error("Invalid item ID");
      error.status = 404;
      error.code = "INVALID_ITEM_ID";
      throw error;
    }
    const items = readData();

    const item = items.find((item) => item.id === Number(id));

    if (!item) {
      const error = new Error("Item not found");
      error.status = 404;
      error.code = "ITEM_NOT_FOUND";
      throw error;
    }

    return item;
  });
}

export async function createItem(data) {
  return fakeRequest(() => {
    const items = readData();

    const nextId =
      items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;

    const newItem = {
      id: nextId,
      name: data.name,
      description: data.description,
    };

    writeData([...items, newItem]);

    return newItem;
  });
}

export async function updateItem(id, changes) {
  return fakeRequest(() => {
    const numericId = Number(id);
    const items = readData();

    const exists = items.some((item) => item.id === numericId);

    if (!exists) {
      throw new Error("Item not found");
    }

    const updatedItems = items.map((item) =>
      item.id === numericId
        ? {
            ...item,
            ...changes,
            id: numericId,
          }
        : item,
    );

    writeData(updatedItems);

    return updatedItems.find((item) => item.id === numericId);
  });
}

export async function deleteItem(id) {
  return fakeRequest(() => {
    const numericId = Number(id);
    const items = readData();

    const exists = items.some((item) => item.id === numericId);

    if (!exists) {
      throw new Error("Item not found");
    }

    const updatedItems = items.filter((item) => item.id !== numericId);

    writeData(updatedItems);

    return {
      success: true,
      id: numericId,
    };
  });
}
