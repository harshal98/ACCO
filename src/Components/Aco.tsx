import { BollingerBands } from "@debut/indicators";
import axios, { AxiosResponse } from "axios";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  HStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Timer from "./Timer";

let FuturePairs: string[] = [];

function Aco() {
  //let [data, setdata] = useState<Klinedata>([]);
  let [resetcd, setresetcd] = useState(0);
  let [Acodata, setAcodata] = useState<
    {
      pair: string;
      percentrank: number;
      bb15m: string;
      bb1h: string;
      bb4h: string;
    }[]
  >([]);

  function generateData() {
    getAllTimeKline().then((res) => {
      let temp1: {
        futurepair: string;
        BB15mArray: {
          lower: number;
          middle: number;
          upper: number;
        }[];
        BB1hArray: {
          lower: number;
          middle: number;
          upper: number;
        }[];
        BB4hArray: {
          lower: number;
          middle: number;
          upper: number;
        }[];
        lastprice: number;
      }[] = [];
      let lastprice = 0;
      FuturePairs.forEach((futurepair) => {
        lastprice = Number(
          res.m15m.filter((i) => i.pair == futurepair)[0].kline[
            res.m15m.filter((i) => i.pair == futurepair)[0].kline.length - 1
          ].c
        );
        let BB15mArray = getBB(
          res.m15m.filter((i) => i.pair == futurepair)[0].kline
        );
        let BB1hArray = getBB(
          res.h1.filter((i) => i.pair == futurepair)[0].kline
        );
        let BB4hArray = getBB(
          res.h4.filter((i) => i.pair == futurepair)[0].kline
        );

        temp1.push({ futurepair, BB15mArray, BB1hArray, BB4hArray, lastprice });
      });

      let temp2 = temp1
        .map((i) => {
          let middif15m =
            i.BB15mArray[i.BB15mArray.length - 1].middle -
            i.BB15mArray[i.BB15mArray.length - 2].middle;
          let lowdiff15m =
            i.BB15mArray[i.BB15mArray.length - 1].lower -
            i.BB15mArray[i.BB15mArray.length - 2].lower;

          let middif1h =
            i.BB1hArray[i.BB1hArray.length - 1].middle -
            i.BB1hArray[i.BB1hArray.length - 2].middle;
          let lowdiff1h =
            i.BB1hArray[i.BB1hArray.length - 1].lower -
            i.BB1hArray[i.BB1hArray.length - 2].lower;

          let middif4h = 0;
          let lowdiff4h = 0;
          if (i.BB4hArray.length > 2) {
            middif4h =
              i.BB4hArray[i.BB4hArray.length - 1].middle -
              i.BB4hArray[i.BB4hArray.length - 2].middle;
            lowdiff4h =
              i.BB4hArray[i.BB4hArray.length - 1].lower -
              i.BB4hArray[i.BB4hArray.length - 2].lower;
          }
          let bb15m =
            //middif15m > 0 ||
            (middif15m > 0 && lowdiff15m < 0) ||
            (middif15m < 0 && lowdiff15m > 0)
              ? "Yes"
              : "No";
          let bb1h =
            (middif1h > 0 && lowdiff1h < 0) || (middif1h < 0 && lowdiff1h > 0)
              ? "Yes"
              : "No";
          let bb4h =
            (middif4h > 0 && lowdiff4h < 0) || (middif4h < 0 && lowdiff4h > 0)
              ? "Yes"
              : "No";
          return { pair: i.futurepair, bb15m, bb1h, bb4h };
        })
        .filter((i) => i.bb1h == "Yes" && i.bb4h == "Yes");
      get24hrpercent().then((res) => {
        setAcodata(
          temp2
            .map((i) => {
              return {
                ...i,
                percentrank: res.findIndex((r) => {
                  return r.pair == i.pair;
                }),
              };
            })
            .sort((i, j) => {
              if (i.percentrank > j.percentrank) return 1;
              else return -1;
            })
        );
      });
    });
  }

  useEffect(() => {
    generateData();
    let t = setInterval(() => {
      generateData(), setresetcd((r) => r + 1);
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // useEffect(() => {
  //   console.log(Acodata);
  // });

  async function get24hrpercent() {
    let temp: {
      pair: string;
      priceChangePercent: number;
    }[] = [];
    await axios
      .get(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=[${FuturePairs.map(
          (i) => `"${i}"`
        )}]`
      )
      .then((res) => {
        temp = res.data.map((i: any) => {
          return {
            pair: i.symbol,
            priceChangePercent: Number(i.priceChangePercent),
          };
        });
        temp.sort((i: any, j: any) => {
          if (i.priceChangePercent > j.priceChangePercent) return -1;
          else if (i.priceChangePercent < j.priceChangePercent) return 1;
          return 0;
        });
      });
    return temp;
  }

  return (
    <>
      <HStack>
        <Timer count={resetcd}></Timer>
      </HStack>
      <TableContainer>
        <Table variant="striped" colorScheme="teal" size="lg">
          <TableCaption>Accelerator Oscillator</TableCaption>
          <Thead>
            <Tr>
              <Th>Index</Th>
              <Th>Pair</Th>
              <Th>DailyRank</Th>
              <Th>BB4h</Th>
              <Th>BB1h</Th>
              <Th>BB4h</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Acodata.map((i, indx) => (
              <Tr key={indx}>
                <Td>{indx + 1}</Td>

                <Td>{i.pair}</Td>
                <Td>{i.percentrank}</Td>
                <Td>{i.bb15m}</Td>
                <Td>{i.bb1h}</Td>
                <Td>{i.bb4h}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}

async function getKlineData(time: string) {
  let promisarray: any[] = [];
  await axios
    .get(
      "https://raw.githubusercontent.com/harshal98/Pairs/main/FuturePairs.js"
    )
    .then((res) => (FuturePairs = res.data));

  FuturePairs.forEach((item) => {
    promisarray.push(
      axios.get(
        `https://api.binance.com/api/v3/klines?interval=${time}&limit=100&symbol=${item}`
      )
    );
  });
  let res = await axios.all(promisarray);
  let temp: { pair: string; kline: { c: number }[] }[] = [];
  res.forEach((r: AxiosResponse) => {
    let pairUrl = String(r.request.responseURL);
    pairUrl = pairUrl.substring(pairUrl.lastIndexOf("=") + 1);
    let hc: { c: number }[] = [];

    r.data.forEach((i: any[]) =>
      hc.push({
        c: Number(i[4]),
      })
    );
    temp.push({ pair: pairUrl, kline: hc });
  });

  return temp;
}

async function getAllTimeKline() {
  let m15m = await getKlineData("15m");
  let h1 = await getKlineData("1h");
  let h4 = await getKlineData("4h");

  return { m15m, h1, h4 };
}

function getBB(klinedata: { c: number }[]) {
  let BB = new BollingerBands();
  let BBarray: {
    lower: number;
    middle: number;
    upper: number;
  }[] = [];
  klinedata.forEach((kline) => {
    let val = BB.nextValue(kline.c);
    if (val) {
      BBarray.push(val);
    }
  });
  return BBarray;
}
export default Aco;
