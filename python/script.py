import csv
import json

def buildDataHierarchy():
    data_file = open('../data/DearTechPeople-Data.csv', 'rU')
    reader = csv.DictReader(data_file)
    data_dict = {}
    for row in reader:
        sector = row['sector_1']
        customer_base = row['customer_base_1']
        company = row['company_name']
        total_male = int(row['total_male'])
        total_female = int(row['total_female'])

        if sector == '':
            sector = 'no sector'

        company_dict = { 'name': company, 'children': [{ 'name': 'percent_male', 'size': 100*(total_male)/float(total_male + total_female) }, { 'name': 'percent_female', 'size': 100*(total_female)/float(total_male + total_female) }] }

        if sector in data_dict:
            sector_dict = data_dict[sector]
            if customer_base in sector_dict:
                company_list = sector_dict[customer_base]
                company_list.append(company_dict)
            else:
                sector_dict[customer_base] = [company_dict]
        else:
            data_dict[sector] = {customer_base: [company_dict]}

    data = {'name': 'deartechpeople', 'children': []}
    for (sector, value) in data_dict.items():
        json_dict = {'name': sector, 'children': []}
        for (customer, companies) in value.items():
            children_dict = {'name': customer, 'children': companies}
            json_dict['children'].append(children_dict)
        data['children'].append(json_dict)

    data_json = json.dumps(data, indent=4)
    json_file = open('../json/data_hierarchy.json', 'w')
    json_file.write(data_json)
    data_file.close()
    json_file.close()

if __name__ == '__main__':
    buildDataHierarchy()



#######################################################
# secondary_sector = row['sector_2']
# if secondary_sector != '':
#     print secondary_sector
#######################################################
