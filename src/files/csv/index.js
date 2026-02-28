import fs from "fs";
import path from "path";
import jsonexport from "jsonexport";

import { OUTPUT_PATH } from "../../constants/index.js";

export const writeCsvToFile = (data, fileName) => {
  const filePath = path.join(OUTPUT_PATH, fileName);

  const csvData = convertDataToCsv(data);

  jsonexport(csvData, (error, fileContent) => {
    if (error) throw error;

    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, fileContent);
    } catch (error) {
      throw Error(`❌ Failed to create directories or write the CSV file`);
    }
  });
};

const convertDataToCsv = (data = {}) =>
  Object.keys(data).map((matchId) => {
    const { stage, status, date, home, away, result, information, statistics } =
      data[matchId] ?? {};
    const informationObject = {};
    const statisticsObject = {};
    const informationEntries = Array.isArray(information) ? information : [];
    const statisticsEntries = Array.isArray(statistics) ? statistics : [];

    informationEntries.forEach((info) => {
      const category = info?.category;
      if (typeof category !== "string") return;

      informationObject[category.toLowerCase().replace(/ /g, "_")] =
        info?.value ?? null;
    });

    statisticsEntries.forEach((stat) => {
      const category = stat?.category;
      if (typeof category !== "string") return;

      statisticsObject[category.toLowerCase().replace(/ /g, "_")] = {
        home: stat?.homeValue ?? null,
        away: stat?.awayValue ?? null,
      };
    });

    return {
      matchId,
      stage,
      status,
      date,
      home,
      away,
      result,
      information: { ...informationObject },
      statistics: { ...statisticsObject },
    };
  });
