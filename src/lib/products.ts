import { getSupabaseBrowserClient } from "./supabase-browser";

export type Product = { id: string; name: string; category: string; price: number; updatedAt?: string };
type SeedRow = [string, string, number];
export const productSeed: SeedRow[] = [
  ...([20,25,32,40,50].flatMap((size,i) => ["خفيف","وسط","ثقيل"].map((grade,j) => [`لفة مواسير ${size} مم (${grade})`,`مواسير UPVC`,[[450,770,910],[380,700,840],[380,700,770],[380,700,770],[325,630,700]][i][j]] as SeedRow))),
  ...([[["10×10",10.5,18.5],["10×15",20,30],["14×19",40,60],["19×24",55,85],["22×30",95,130],["30×38",165,240]].flatMap(([size,p1,p2]) => [[`بواط ${size} (شعبي)`,`بواطات`,p1],[`بواط ${size} (درجة أولى AG)`,`بواطات`,p2]]), [["40×45",400]].map(([size,p])=>[`بواط ${size} (درجة أولى AG)`,`بواطات`,p])].flat() as SeedRow[]),
  ...([12,14,16,20,25,32,40,50].flatMap((size,i)=>["شعبي 20 متر","وسط 25 متر","ثقيل 30 متر"].map((grade,j)=>[`فلكسبل حراري ${size} مم (${grade})`,`فلكسبل حراري`,[[80,115,210],[90,135,235],[100,155,280],[140,215,330],[170,235,430],[230,310,580],[320,410,680],[420,510,900]][i][j]] as SeedRow))),
  ...([["جلاندة 16 مم",2.4],["جلاندة 20 مم",3.5],["جلاندة 25 مم",4.5],["جلاندة 32 مم",8.75],["جلاندة 40 مم",10.25],["جلاندة 50 مم",12.25],["علبة لجراند 7×7",7.5],["علبة لجراند 7×10",8.5],["علبة لجراند 7×14",10],["علبة بيت الهندسة 7×7",10],["علبة ماجيك بيت هندسة 7×10",7.5],["علبة بيت الهندسة 7×14",16.5],["علبة بيت الهندسة 10×10",18.5],["سوستة تكريب 20 مم",120],["سوستة تكريب 25 مم",140],["سوستة تكريب 32 مم",190],["بواط 20 مم (1 : 4)",5.75],["بواط 25 مم (1 : 4)",6.25],["بواط 20 مم حروف (H / Y / U)",9],["بواط 25 مم حروف (H / Y / U)",9.5],["علاية بواط حلقة امتداد (علاية)",5.05],["غطاء بواط",1.6],["جلبة 20 مم",1.25],["جلبة 25 مم",1.5],["جلبة 32 مم",3],["جلبة 40 مم",5.25],["جلبة 50 مم",7],["افيز 20 مم",1.25],["افيز 25 مم",1.5],["افيز 32 مم",3],["افيز 40 مم",4],["افيز 50 مم",5],["كوع 20 مم",2],["كوع 25 مم",3.5],["كوع 32 مم",8],["كوع 40 مم",12.5],["كوع 50 مم",22],["لاكور 20 مم",3.5],["لاكور 25 مم",5],["لاكور 32 مم",6.5],["لاكور 40 مم",10],["لاكور 50 مم",11.5],["كوع زاوية 20 مم",2],["كوع زاوية 25 مم",2.25],["كرنك 20 مم",5],["كرنك 25 مم",6],["كرنك 32 مم",11],["كوع حقن 20 مم",3],["كوع حقن 25 مم",5],["علبة ماجيك خارج 7×10",10]].map(([name,price])=>[name,"إكسسوارات، علب، وجلب",price] as SeedRow))
];
const supabase = getSupabaseBrowserClient();
export async function fetchProducts(): Promise<Product[]> {
  const response = await supabase.from("products").select("id,name,category,price").order("category").order("name");
  let data = response.data;
  const error = response.error;
  if (error) throw new Error(error.code === "42P01" || error.code === "PGRST205"
    ? "جدول products غير موجود في Supabase. شغّل ملف supabase/migrations/202611190001_price_discount_schema.sql أولاً."
    : error.message);
  if (!data?.length) {
    const rows = productSeed.map(([name,category,price])=>({name,category,price}));
    const seeded = await supabase.from("products").insert(rows);
    if (seeded.error) throw seeded.error;
    const refreshed = await supabase.from("products").select("id,name,category,price").order("category").order("name");
    if(refreshed.error) throw refreshed.error;
    data = refreshed.data;
  }
  return ((data ?? []) as {id:string;name:string;category:string;price:number|string;updated_at?:string;updatedAt?:string}[]).map((p) => ({ id:p.id, name:p.name, category:p.category, price:Number(p.price), updatedAt:p.updated_at ?? p.updatedAt }));
}
export async function saveProduct(product: Partial<Product> & {name:string;category:string;price:number}) {
  // updated_at is intentionally omitted: deployed databases may have either
  // timestamp spelling or no timestamp column, and price editing must work in all cases.
  const row = {name:product.name,category:product.category,price:product.price};
  const result = product.id ? await supabase.from("products").update(row).eq("id",product.id) : await supabase.from("products").insert(row);
  if (result.error) throw result.error;
}
export async function deleteProduct(id:string) { const {error}=await supabase.from("products").delete().eq("id",id); if(error) throw error; }
export async function adjustCategory(category:string,percent:number) { const rows=await supabase.from("products").select("id,price").eq("category",category); if(rows.error) throw rows.error; for(const p of rows.data??[]){const {error}=await supabase.from("products").update({price:Math.round(Number(p.price)*(1+percent/100)*100)/100}).eq("id",p.id);if(error)throw error;} }
