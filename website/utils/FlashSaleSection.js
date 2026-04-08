// FlashSaleSection.js
import moment from "moment";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { getProducts } from "../Appwrite";

export default function FlashSaleSection({ theme, themeStyles, router }) {
  const [flashProducts, setFlashProducts] = useState([]);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const now = new Date();
        const data = await getProducts(); /* getP('', 10, 0, 'flashSale'); */ // pass filter param
        const activeSales = data.filter((p) => new Date(p.saleEndTime) > now);
        setFlashProducts(activeSales);
      } catch (error) {
        console.error("Error fetching flash sales:", error);
      }
    };
    fetchFlashSales();
  }, []);

  useEffect(() => {
    if (flashProducts.length > 0) {
      const interval = setInterval(() => {
        const endTime = moment(flashProducts[0].saleEndTime);
        const diff = moment.duration(endTime.diff(moment()));
        setTimeLeft(`${diff.hours()}h ${diff.minutes()}m ${diff.seconds()}s`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [flashProducts]);

  if (flashProducts.length === 0) return null;

  return (
    <View style={{ marginTop: 20 }}>
      <View className="flex-row justify-between items-center mb-2 px-3">
        <Text
          style={{ color: themeStyles.text, fontWeight: "bold", fontSize: 18 }}
        >
          🔥 Flash Sale
        </Text>
        <Text style={{ color: "red", fontWeight: "bold" }}>{timeLeft}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-3"
      >
        {flashProducts.map((item) => (
          <TouchableOpacity
            key={item.$id}
            onPress={() =>
              router.push({
                pathname: "/(Screens)/ProductDetails",
                params: { item: JSON.stringify(item) },
              })
            }
            className="mr-3"
          >
            <View
              style={{
                backgroundColor: themeStyles.accent,
                borderRadius: 10,
                padding: 8,
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={{ width: 100, height: 100, borderRadius: 8 }}
                resizeMode="cover"
              />
              <Text
                style={{
                  color: themeStyles.text,
                  fontWeight: "bold",
                  marginTop: 4,
                }}
              >
                {item.salePrice}
                <Text
                  style={{
                    color: "gray",
                    textDecorationLine: "line-through",
                    marginLeft: 4,
                  }}
                >
                  {item.price}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
