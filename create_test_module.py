import zipfile
import os

def create_erp_zip():
    module_id = "erp-inventory"
    
    # Define the module manifest (What the core reads to build the sidebar)
    manifest = {
        "id": module_id,
        "name": "Inventory Pro",
        "icon": "fad fa-warehouse", # FontAwesome Duotone Icon
        "navItems": [
            { "label": "Warehouse Stock", "href": "/dashboard/erp-inventory/stock" },
            { "label": "Purchase Orders", "href": "/dashboard/erp-inventory/orders" }
        ]
    }

    # Define a dummy page component
    page_content = """
    export default function StockPage() {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold">ERP Inventory: Warehouse A</h1>
                <p className="text-slate-500">This module was installed via ZIP!</p>
            </div>
        );
    }
    """

    # Create the ZIP
    with zipfile.ZipFile('erp_module.zip', 'w') as z:
        z.writestr('module.json', str(manifest).replace("'", '"'))
        z.writestr('pages/stock.tsx', page_content)
        z.writestr('pages/orders.tsx', "export default function Orders() { return <div>Orders Page</div> }")

    print("✅ Created 'erp_module.zip'. You can now upload this in your System Settings!")

if __name__ == "__main__":
    create_erp_zip()